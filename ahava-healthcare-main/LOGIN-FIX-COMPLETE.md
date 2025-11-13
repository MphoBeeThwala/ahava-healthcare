Patient and nurse login fix summary

On October 18, 2025 the patient and nurse applications refused to log in while the admin portal continued to function. The root cause was in each app’s auth store: the `login` function returned `Promise<void>`, so the login pages—which expect to inspect `response.user.role`—found `undefined` instead of user details and failed to redirect properly.

The fix involved updating `apps/patient/src/store/authStore.ts` and `apps/nurse/src/store/authStore.ts` to change the signature to `Promise<any>` and explicitly `return response.data` once the API call succeeds. A code snippet that illustrates the change:
```
login: async (email: string, password: string) => {
  const response = await authAPI.login(email, password);
  if (response.data.success && response.data.user) {
    set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    return response.data;
  }
}
```

To verify the fix, open http://localhost:3002/login and sign in with `patient@ahava.com / Test@123456789`. You should see the success toast, be redirected to the patient dashboard, and find the patient’s name displayed. Repeat at http://localhost:3003/login using `nurse@ahava.com / Test@123456789`; a nurse-only dashboard should appear (with an access warning if the role is incorrect). The Next.js development servers recompiled automatically, so no restart is required—just refresh the browsers.

Verification checklist: patient and nurse logins succeed, dashboards display correctly, admin login remains unaffected, user data renders properly, and no console errors surface.

With logins operational you can continue testing portal features: the admin view (users, visits, payments), patient dashboard and navigation/booking flows, and nurse visit assignments, status updates, and notes.

Guide recorded by Mpho Thwala on behalf of Ahava on 88 Company.




