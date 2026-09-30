export interface BrowserDriver {
  navigate(url: string): Promise<{ url: string; title: string }>
  extract(): Promise<{ url: string; text: string }>
  screenshot(): Promise<{ mime: "image/png"; dataUrl: string }>
  click(selector: string): Promise<{ ok: boolean }>
  type(selector: string, value: string): Promise<{ ok: boolean }>
  takeOver(reason: string): Promise<void>
  handBack(): Promise<void>
}
