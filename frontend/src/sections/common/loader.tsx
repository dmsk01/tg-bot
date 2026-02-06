import Box from '@mui/material/Box';

interface LoaderProps {
  text?: string;
}

export function Loader({ text: _text }: LoaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="video"
        autoPlay
        loop
        muted
        playsInline
        sx={{
          width: 200,
          height: 200,
          objectFit: 'contain',
        }}
      >
        <source src="/loader.mp4" type="video/mp4" />
      </Box>
    </Box>
  );
}
