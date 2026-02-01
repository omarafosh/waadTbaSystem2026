import { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project imports
import Drawer from './Drawer';
import Header from './Header';
import Footer from './Footer';
import Loader from 'components/Loader';
// import Breadcrumbs from 'components/@extended/Breadcrumbs'; // ✅ Disabled: Pages use ModernPageHeader with breadcrumbs
import useAuth from 'hooks/useAuth';

import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| MAIN LAYOUT - HORIZONTAL NAVIGATION ||============================== //

export default function DashboardLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { menuMasterLoading } = useGetMenuMaster();
  const downXL = useMediaQuery((theme) => theme.breakpoints.down('xl'));

  const { state } = useConfig();
  const isContainer = state.container;

  // ✅ Sidebar disabled - using horizontal navigation in header
  // set media wise responsive drawer
  // useEffect(() => {
  //   if (state.menuOrientation !== MenuOrientation.MINI_VERTICAL) {
  //     handlerDrawerOpen(!downXL);
  //   }
  // }, [downXL]);

  // ✅ FIXED: Conditional returns AFTER all hooks
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (menuMasterLoading) return <Loader />;

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100vh', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      {/* ✅ Drawer/Sidebar removed - using horizontal navigation */}
      {/* <Drawer /> */}

      <Box component="main" sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ✅ Spacer matching adjusted header height */}
        <Toolbar sx={{ minHeight: { xs: 60, sm: 68 }, height: { xs: 60, sm: 68 }, flexShrink: 0 }} />
        <Container
          maxWidth={isContainer ? 'xl' : false}
          sx={{
            // Professional UX: Optimized spacing for data density
            // Further reduced spacing to compensate for taller navbar and eliminate scroll
            pt: { xs: 0.5, sm: 1 },
            pb: { xs: 0.5, sm: 1 },
            px: { xs: 1.5, sm: 2 },
            ...(isContainer && { px: { xs: 0, sm: 2 } }),
            position: 'relative',
            flexGrow: 1, // Fill remaining space in main box
            height: '100%', // Ensure it takes full height of parent
            overflow: 'hidden', // Prevent container scroll, let inner components handle it
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* ✅ Breadcrumbs disabled - Pages use ModernPageHeader with integrated breadcrumbs */}
          {/* {pathname !== '/apps/profiles/account/my-account' && <Breadcrumbs />} */}
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
