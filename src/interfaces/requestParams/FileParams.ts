export default interface FileParams {
  stageId: number,
  dataType: string,
  ext: string,
  title: string,
  skip: number,
  sheet: number,
  filePath?: string,
  originalFileName?: string,
  url?: string
}