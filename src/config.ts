export const siteConfig = {
  title: 'PDF Viewer',
  copyright: 'PDF Viewer',
  paths: {
    home: '/',
    view: (id: string) => `/view/${id}`,
    pdf: (fileName: string) => `/pdf/${fileName}`,
  },
} as const;
