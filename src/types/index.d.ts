export type { IPool, IVault, IAssetsInfo } from './entities'

declare module '*.gql' {
  import { DocumentNode } from 'graphql'
  const Schema: DocumentNode

  export = Schema
}
