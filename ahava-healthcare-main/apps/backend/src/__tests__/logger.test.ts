import logger, { LogLevel } from '../utils/logger';

describe('Logger', () => {
  // Mock console.log to prevent actual logging during tests
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  afterEach(() => {
    consoleLogSpy.mockClear();
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log security events', () => {
    logger.security('Test security event');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log with metadata', () => {
    logger.info('Test with metadata', { userId: '123', action: 'login' });
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log errors with stack traces', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log database operations', () => {
    logger.logDatabaseOperation('CREATE', 'User', '123');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log security events with metadata', () => {
    logger.logSecurityEvent('Failed login attempt', 'user-123', { 
      ip: '192.168.1.1',
      attempts: 3 
    });
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});


