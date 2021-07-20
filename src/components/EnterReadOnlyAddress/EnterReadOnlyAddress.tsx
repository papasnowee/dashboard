import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ValidationMessage, Panel } from './styles'

import { useStores } from '@/stores/utils'
import { observer } from 'mobx-react'
import { useHistory } from 'react-router-dom'
import { PATHS } from '@/routes'
import { validateAddress } from '@/utils/utils'

export const EnterReadOnlyAddress: React.FC = observer((props) => {
  const [address, setAddress] = useState('')
  const [isNotValid, setIsNotValid] = useState(false)
  const history = useHistory()

  const { appStore } = useStores()

  const handleChange = (event: any) => {
    if (isNotValid) {
      setIsNotValid(false)
    }
    setAddress(event.target.value)
  }

  const checkBalance = (e) => {
    e.preventDefault()

    if (validateAddress(address!)) {
      appStore.setAddress(address)
      history.push(PATHS.checkBalance.replace(':address', address))
    } else {
      setIsNotValid(true)
    }
  }

  return (
    <Panel>
      <form onSubmit={checkBalance}>
        {isNotValid && (
          <motion.div
            initial={{ x: 0, y: -100, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 0, y: -100, opacity: 1 }}
          >
            <ValidationMessage className="validation-message">
              <p>You must enter a valid address</p>
            </ValidationMessage>
          </motion.div>
        )}

        <div className="read-only-header">
          <h1>Enter a wallet address for read-only mode</h1>
          <div className="address-input">
            <input
              type="text"
              value={address}
              placeholder="Enter address"
              onChange={handleChange}
            />
          </div>
        </div>
        <button className="check-all button" type="submit">
          Check Balance
        </button>
      </form>
    </Panel>
  )
})
