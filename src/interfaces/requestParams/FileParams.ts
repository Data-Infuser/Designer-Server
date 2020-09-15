export default interface FileParams {
  dataType: string,
  ext: string,
  title: string,
  skip: number,
  sheet: number,
  filePath?: string,
  originalFileName?: string,
  url?: string
}