export type AppConfig = {
  id: string;
  name: string;
  slug: string;
  basePath: string;
};

export const docspaceConfig: AppConfig = {
  id: 'docspace',
  name: 'Docspace',
  slug: 'docspace',
  basePath: '/docspace',
};
