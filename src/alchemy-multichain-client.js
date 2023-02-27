import { Alchemy } from 'alchemy-sdk'

export class AlchemyMultichainClient {
  settings
  overrides

  instances = new Map()

  /**
   * @param settings The settings to use for all networks.
   * @param overrides Optional settings to use for specific networks.
   */

  constructor(settings, overrides) {
    this.settings = settings
    this.overrides = overrides
  }

  forNetwork(network) {
    return this.loadInstance(network)
  }

  loadInstance(network) {
    if (!this.instances.has(network)) {
      const alchemySettings =
        this.overrides && this.overrides[network]
          ? { ...this.overrides[network], network }
          : { ...this.settings, network }
      this.instances.set(network, new Alchemy(alchemySettings))
    }
    return this.instances.get(network)
  }
}
