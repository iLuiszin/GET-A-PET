const Pet = require('../models/Pet')

const checkIfPetExists = async (id) => {
  try {
    const pet = await Pet.findById(id)

    if (!pet) {
      throw new Error('Pet não encontrado!')
    }

    return pet
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = checkIfPetExists
