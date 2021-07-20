import { ethWeb3, PSAddress } from '@/constants'
import { EthereumService } from './EthereumService'
import BigNumber from 'bignumber.js'
import { REWARDS_ABI } from '@/lib/data/ABIs'
import { testPoolWithVault, testRelatedVault } from './testData'

describe('EthereumService', () => {
  describe('getPrice', () => {
    test('if tokenAddress is valid, then result is valid', () => {
      const validTokenAddress = '0xa0246c9032bc3a600820415ae600c6388619a14d'

      return EthereumService.getPrice(validTokenAddress)
        .then((price: BigNumber | null) => {
          expect(price?.constructor.name).toBe('BigNumber')
        })
        .catch(() => {
          expect(true).toBe(false)
        })
    }, 15000)
  })

  describe('getEarned', () => {
    test('If pool has earned method having 1 arguments, then getEarned runs without error', () => {
      const testWallet = '0x814055779f8d2f591277b76c724b7adc74fb82d9'
      const poolAddress = '0xb2b4054f50d5feba40af7759f4619f6b68a95520'
      const poolContract = new ethWeb3.eth.Contract(REWARDS_ABI, poolAddress)

      return EthereumService.getEarned(
        testWallet,
        poolContract,
        ethWeb3,
        poolAddress,
      )
        .then((reward) => {
          expect(reward).toBe('0')
        })
        .catch(() => {
          expect(true).toBe(false)
        })
    }, 10000)

    test('If pool has earned method having 2 arguments, then getEarned runs without error', () => {
      const testWallet = '0x814055779f8d2f591277b76c724b7adc74fb82d9'
      const poolAddress = '0x59a87ab7407371b933cad65001400342519a79bb'
      const poolContract = new ethWeb3.eth.Contract(REWARDS_ABI, poolAddress)

      return EthereumService.getEarned(
        testWallet,
        poolContract,
        ethWeb3,
        poolAddress,
      )
        .then((reward) => {
          expect(reward).toBe('0')
        })
        .catch(() => {
          expect(true).toBe(false)
        })
    }, 10000)
  })
  describe('getAssetsFromPool', () => {
    test('positive scenario', () => {
      const testWallet = '0x814055779f8d2f591277b76c724b7adc74fb82d9'
      const farmPrice = new BigNumber(111)
      const testPartialAssetData = { underlyingAddress: '0x34rerfsfdsffgdfg' }
      return EthereumService.getAssetsFromPool(
        testPoolWithVault,
        testWallet,
        farmPrice,
        testPartialAssetData,
        testRelatedVault,
      )
        .then((assetsInfo) => {
          const isTrue =
            assetsInfo.name === 'UNI_DAI_BSG_#V1' &&
            assetsInfo.earnFarm === true &&
            assetsInfo.stakedBalance?.toString().substring(0, 6) === '1.1446' &&
            assetsInfo.percentOfPool?.constructor.name === 'BigNumber' &&
            assetsInfo.value?.constructor.name === 'BigNumber' &&
            assetsInfo.address.vault?.toLocaleLowerCase() ===
            '0x639d4f3f41daa5f4b94d63c2a5f3e18139ba9e54'.toLocaleLowerCase() &&
            assetsInfo.underlyingBalance?.toString().substring(0, 6) ===
            '1.1446' &&
            assetsInfo.unstakedBalance?.toString() === '0' &&
            assetsInfo.farmToClaim?.constructor.name === 'BigNumber'

          expect(isTrue).toBe(true)
        })
        .catch(() => {
          expect(true).toBe(false)
        })
    }, 10000)
  })
})
