// import.meta.env.BASE_URL приходит с base без завершающего слеша — нормализуем
const base = import.meta.env.BASE_URL.replace(/\/*$/, '/');

export const siteConfig = {
  title: 'PDF Viewer',
  copyright: 'PDF Viewer',
  // 0 — счётчик не подключён: сниппет не вставляется, цели не отправляются
  yandexMetrikaId: 114411306,
  paths: {
    home: base,
    notFound: `${base}404`,
    asset: (fileName: string) => `${base}${fileName}`,
    view: (id: string) => `${base}view/${id}`,
    pdf: (fileName: string) => `${base}pdf/${fileName}`,
  },
} as const;
