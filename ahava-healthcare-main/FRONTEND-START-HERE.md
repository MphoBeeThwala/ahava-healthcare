Frontend quick start guide

The frontend suite is nearly complete—about two hours of finishing work remains before it is production ready. All four portals are in place: the admin portal handles user management and analytics, the patient app covers booking and visit history, the nurse app manages visit updates and reporting, and the doctor app supports visit reviews. Every application uses the shared stack of Next.js 14, TypeScript, Tailwind CSS, and Zustand.

Current focus points: authentication updates are underway to remove localStorage usage and rely solely on httpOnly cookies. Once that lands, create the environment files for each app, install dependencies, and confirm that every portal starts without errors. Expect roughly fifteen minutes to set up the environment files, ten minutes to install packages, and thirty minutes to walk through startup tests together.

Assessment summary: see `FRONTEND-ASSESSMENT-REPORT.md` for the comprehensive evaluation. In short, structure and code quality rate as excellent, API clients align perfectly with the backend, and the only outstanding items relate to the authentication change, environment configuration, and fresh dependency installs.

Next steps: finish the authentication change, create the `.env.local` files, run the installs, and then test the four apps. At that point we can exercise the workflows end to end.

Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.
