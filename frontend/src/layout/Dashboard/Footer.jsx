// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ gap: 1, alignItems: 'center', justifyContent: 'center', p: '12px 16px', mt: 'auto', minHeight: '50px' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        &copy; AlfaBeta – All Rights Reserved
      </Typography>
    </Stack>
  );
}
