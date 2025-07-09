import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mail Manager',
    short_name: 'Mail Manager',
    description: 'Mail Manager',
    start_url: '/',
    display: 'standalone',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
