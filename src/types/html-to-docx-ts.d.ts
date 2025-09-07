declare module 'html-to-docx-ts' {
  export class Packer {
    static toBlob(html: string): Promise<Blob>
  }
}
