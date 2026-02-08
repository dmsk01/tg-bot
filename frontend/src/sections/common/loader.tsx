import Box from '@mui/material/Box';

interface LoaderProps {
  text?: string;
}

export function Loader({ text: _text }: LoaderProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        <Box
          component="video"
          autoPlay
          loop
          muted
          playsInline
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src="/loader.mp4" type="video/mp4" />
        </Box>
      </Box>
    </Box>
  );
}
