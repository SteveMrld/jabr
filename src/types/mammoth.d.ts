declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: { type: string; message: string }[];
  }
  interface MammothOptions {
    buffer?: Buffer;
    path?: string;
    arrayBuffer?: ArrayBuffer;
  }
  function extractRawText(options: MammothOptions): Promise<MammothResult>;
  function convertToHtml(options: MammothOptions): Promise<MammothResult>;
  export default { extractRawText, convertToHtml };
}
