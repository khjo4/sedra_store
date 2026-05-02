import { Font } from '@react-pdf/renderer'

// Register Arabic fonts
Font.register({
  family: 'Cairo',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalkIvTp2.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalkIvTp2.woff2',
      fontWeight: 'bold',
    },
  ],
})

// Fallback font for numbers
Font.register({
  family: 'Noto Sans',
  src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aPdu2ui.woff2',
})