import { RouterProvider } from 'react-router-dom';
import { Suspense } from 'react';

// MUI X Date Pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';

import Locales from 'components/Locales';
import RTLLayout from 'components/RTLLayout';
import ScrollTop from 'components/ScrollTop';
import Snackbar from 'components/@extended/Snackbar';
import Notistack from 'components/third-party/Notistack';
import Metrics from 'metrics';
import Loader from 'components/Loader';

// Error Boundary - Production Safety
import { SystemErrorBoundary } from 'components/ErrorBoundary';

// auth-provider
import { AuthProvider } from 'contexts/AuthContext';
import { EmployerFilterProvider } from 'contexts/EmployerFilterContext';
import { CompanySettingsProvider } from 'contexts/CompanySettingsContext';

// Production console cleanup
import { suppressMUIDeprecationWarnings } from 'utils/gridMigration';

// Initialize production mode settings
if (import.meta.env.PROD) {
  suppressMUIDeprecationWarnings();
}

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //
// CompanySettingsProvider - SINGLE SOURCE OF TRUTH for company branding
// Loaded ONCE at startup, consumed by Header, Logo, Exports

export default function App() {
  return (
    <SystemErrorBoundary>
      <ThemeCustomization>
        <RTLLayout>
          <Locales>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <ScrollTop>
                <AuthProvider>
                  <CompanySettingsProvider>
                    <EmployerFilterProvider>
                      <Notistack>
                        <Suspense fallback={<Loader />}>
                          <RouterProvider router={router} />
                        </Suspense>
                        <Snackbar />
                      </Notistack>
                    </EmployerFilterProvider>
                  </CompanySettingsProvider>
                </AuthProvider>
              </ScrollTop>
            </LocalizationProvider>
          </Locales>
        </RTLLayout>
      </ThemeCustomization>
      <Metrics />
    </SystemErrorBoundary>
  );
}
