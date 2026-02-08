import type { Theme, SxProps } from '@mui/material/styles';

import DOMPurify from 'dompurify';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

interface SafeHtmlProps {
  html: string;
  sx?: SxProps<Theme>;
}

export function SafeHtml({ html, sx }: SafeHtmlProps) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });

  return <Box dangerouslySetInnerHTML={{ __html: sanitizedHtml }} sx={sx} />;
}
