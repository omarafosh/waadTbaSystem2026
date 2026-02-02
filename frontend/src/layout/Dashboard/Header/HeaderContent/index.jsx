import { useMemo } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

// project imports
import Profile from './Profile';
import Localization from './Localization';
import Notification from './Notification';
import FullScreen from './FullScreen';
// import Customization from './Customization'; // ✅ Moved to إعدادات النظام page
import MobileSection from './MobileSection';
import HorizontalNavigation from './HorizontalNavigation';
import ThemeModeToggle from './ThemeModeToggle';

import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import { useCompanySettings } from 'contexts/CompanySettingsContext';
import { MenuOrientation } from 'config';
import DrawerHeader from 'layout/Dashboard/Drawer/DrawerHeader';
import { useLocation } from 'react-router-dom';

// Fallback static asset
import waadLogoFallback from 'assets/images/waad-logo.png';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const { state } = useConfig();
  const { user } = useAuth();
  const { companyName, companyNameEn, primaryColor, getLogoSrc, hasLogo, getInitials, settings } = useCompanySettings();
  const { pathname } = useLocation();

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  // Check if user is a Provider
  // FIX: Remove URL-based check so Admins retain their Admin UI even when visiting portal pages
  const isProvider = user?.roles?.includes('PROVIDER');

  const providerName = user?.providerName || (user?.roles?.includes('SUPER_ADMIN') ? 'مستشفى الرازي - بنغازي' : null);

  const localization = useMemo(() => <Localization />, []);

  // Display name: Arabic for RTL, English for LTR
  const displayName = companyName || companyNameEn || 'TBA';

  return (
    <>
      {state.menuOrientation === MenuOrientation.HORIZONTAL && !downLG && <DrawerHeader open={true} />}

      {/* ✅ System Logo/Title - Different for Provider */}
      {!downLG && (
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          {/* Legacy Provider Logic Removed - Always Show Company Branding */}
          {(
            // Company branding from settings (SINGLE SOURCE OF TRUTH)
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Always show logo - uses fallback if no custom logo */}
              {hasLogo() || waadLogoFallback ? (
                <Box
                  component="img"
                  src={getLogoSrc()}
                  alt={displayName}
                  sx={{
                    height: 32,
                    width: 'auto',
                    maxWidth: 100,
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    // Fallback to avatar if both custom and static fallback fail
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}

              {/* Fallback initials avatar (hidden by default, shown if img fails) */}
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32,
                  fontSize: '1rem',
                  display: hasLogo() || waadLogoFallback ? 'none' : 'flex'
                }}
              >
                {getInitials()}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: 'primary.main',
                    fontSize: '1rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '1rem',
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {settings?.businessType || 'إدارة التأمين الصحي'}
                </Typography>
              </Box>
            </Stack>
          )}
        </Box>
      )}

      {/* ✅ Provider Info Section - Added to restore context while keeping Logo */}
      {!downLG && isProvider && (
        <Stack spacing={0.5} sx={{ mx: 2, borderRight: '2px solid', borderColor: 'divider', pr: 2, minWidth: 180 }}>
          <Typography variant="subtitle2" color="primary.dark" fontWeight="800" sx={{ lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
            {providerName || 'مقدم خدمة'}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ lineHeight: 1, whiteSpace: 'nowrap' }}>
            مستشفى / مركز طبي
          </Typography>
        </Stack>
      )}

      {/* ✅ Navigation Horizontal - القائمة الأفقية */}
      {!downLG && <HorizontalNavigation />}

      <Box sx={{ width: 1, ml: 1 }} />

      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
        {/* ✅ Welcome Message with Username */}
        {user && (
          <Chip
            icon={isProvider ? <LocalHospitalIcon /> : <PersonIcon />}
            label={`مرحباً، ${user.fullName || user.username}`}
            variant="outlined"
            color={isProvider ? 'success' : 'primary'}
            sx={{
              borderRadius: 2,
              fontWeight: 500,
              '& .MuiChip-icon': { color: isProvider ? 'success.main' : 'primary.main' }
            }}
          />
        )}
        {localization}
        <ThemeModeToggle />
        <Notification />
        {!downLG && <FullScreen />}
        {/* ✅ Customization moved to إعدادات النظام page */}
        {!downLG && <Profile />}
        {downLG && <MobileSection />}
      </Stack>
    </>
  );
}
