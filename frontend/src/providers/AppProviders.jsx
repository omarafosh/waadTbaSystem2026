
import PropTypes from 'prop-types';
import { Suspense } from 'react';

// MUI X Date Pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// project imports
import ThemeCustomization from 'themes';
import Locales from 'components/Locales';
import RTLLayout from 'components/RTLLayout';
import ScrollTop from 'components/ScrollTop';
import Notistack from 'components/third-party/Notistack';
import Loader from 'components/Loader';
import { SystemErrorBoundary } from 'components/ErrorBoundary';

// auth-provider
import { AuthProvider } from 'contexts/AuthContext';
import { EmployerFilterProvider } from 'contexts/EmployerFilterContext';
import { CompanySettingsProvider } from 'contexts/CompanySettingsContext';
import { GlobalImportProgressProvider } from 'contexts/GlobalImportProgressContext';

const AppProviders = ({ children }) => {
    return (
        <SystemErrorBoundary>
            <CompanySettingsProvider>
                <ThemeCustomization>
                    <RTLLayout>
                        <Locales>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <ScrollTop>
                                    <AuthProvider>
                                        <EmployerFilterProvider>
                                            <GlobalImportProgressProvider>
                                                <Notistack>
                                                    {children}
                                                </Notistack>
                                            </GlobalImportProgressProvider>
                                        </EmployerFilterProvider>
                                    </AuthProvider>
                                </ScrollTop>
                            </LocalizationProvider>
                        </Locales>
                    </RTLLayout>
                </ThemeCustomization>
            </CompanySettingsProvider>
        </SystemErrorBoundary>
    );
};

AppProviders.propTypes = {
    children: PropTypes.node
};

export default AppProviders;
