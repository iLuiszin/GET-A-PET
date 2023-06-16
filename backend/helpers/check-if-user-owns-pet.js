const getToken = require('./get-token')
const getUserByToken = require('./get-user-by-token')

const checkIfUserOwnsPet = async (req, pet) => {
  try {
    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.equals(user._id)) {
      throw new Error('Você não pode agendar uma visita com seu próprio pet')
    }

    return true
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = checkIfUserOwnsPet
