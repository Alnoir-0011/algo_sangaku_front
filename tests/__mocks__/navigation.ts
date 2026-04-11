export const useServerInsertedHTML = (_callback: () => unknown) => {};

export const useRouter = () => ({
  push: (_url: string) => {},
  replace: (_url: string) => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: (_url: string) => {},
});

export const useSearchParams = () => new URLSearchParams();

export const usePathname = () => "/";

export const useParams = () => ({});

export const redirect = (_url: string) => {};

export const notFound = () => {};
