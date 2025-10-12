import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  userId?: string;
  requestId?: string;
}

class Logger {
  private logDir: string;
  private logStream: any;

  constructor() {
    this.logDir = process.env.LOG_DIR || join(process.cwd(), 'logs');
    this.initializeLogDir();
    this.initializeLogStream();
  }

  private initializeLogDir() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private initializeLogStream() {
    const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
    const logFilePath = join(this.logDir, logFileName);
    
    this.logStream = createWriteStream(logFilePath, { flags: 'a' });
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private writeLog(entry: LogEntry) {
    const formattedLog = this.formatLog(entry);
    
    // Write to file
    if (this.logStream) {
      this.logStream.write(formattedLog);
    }

    // In development, also log to console with color
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        DEBUG: '\x1b[36m', // Cyan
        INFO: '\x1b[32m',  // Green
        WARN: '\x1b[33m',  // Yellow
        ERROR: '\x1b[31m', // Red
        SECURITY: '\x1b[35m', // Magenta
      };
      
      const reset = '\x1b[0m';
      const color = colors[entry.level] || reset;
      
      console.log(
        `${color}[${entry.timestamp}] ${entry.level}${reset}: ${entry.message}`,
        entry.metadata ? entry.metadata : ''
      );
    }
  }

  public log(level: LogLevel, message: string, metadata?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    this.writeLog(entry);
  }

  public debug(message: string, metadata?: any) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: any) {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: any) {
    this.log(LogLevel.WARN, message, metadata);
  }

  public error(message: string, error?: Error | any, metadata?: any) {
    this.log(LogLevel.ERROR, message, {
      error: error?.message || error,
      stack: error?.stack,
      ...metadata,
    });
  }

  public security(message: string, metadata?: any) {
    this.log(LogLevel.SECURITY, message, metadata);
  }

  // Request logging
  public logRequest(req: any, res: any, duration: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: 'HTTP Request',
      metadata: {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
      },
      userId: req.user?.id,
      requestId: req.id,
    };

    this.writeLog(entry);
  }

  // Security event logging
  public logSecurityEvent(
    event: string,
    userId?: string,
    metadata?: any
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.SECURITY,
      message: event,
      metadata,
      userId,
    };

    this.writeLog(entry);
  }

  // Database operation logging
  public logDatabaseOperation(
    operation: string,
    model: string,
    recordId?: string,
    metadata?: any
  ) {
    this.debug(`Database ${operation}`, {
      model,
      recordId,
      ...metadata,
    });
  }

  public close() {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

// Singleton instance
const logger = new Logger();

// Handle process termination
process.on('SIGTERM', () => {
  logger.close();
});

process.on('SIGINT', () => {
  logger.close();
});

export default logger;


