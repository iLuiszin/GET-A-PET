const Pet = require('../models/Pet')

// helpers
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = class petController {
  // create a pet

  static async create(req, res) {
    const { name, age, weight, color } = req.body

    const images = req.files

    const available = true

    // images upload

    // validations
    if (!name) {
      res.status(422).json({ error: 'O nome é obrigatório' })
      return
    }

    if (!age) {
      res.status(422).json({ error: 'A idade é obrigatória' })
      return
    }

    if (!weight) {
      res.status(422).json({ error: 'O peso é obrigatório' })
      return
    }

    if (!color) {
      res.status(422).json({ error: 'A cor é obrigatória' })
      return
    }

    if (images.length === 0) {
      res.status(422).json({ error: 'A imagem é obrigatória' })
      return
    }

    // get pet owner
    const token = getToken(req)
    const user = await getUserByToken(token)

    // create a pet
    const pet = new Pet({
      name,
      age,
      weight,
      color,
      available,
      images: [],
      user: {
        _id: user._id,
        name: user.name,
        image: user.image,
        phone: user.phone,
      },
    })

    images.map((image) => {
      pet.images.push(image.filename)
    })

    try {
      const newPet = await pet.save()
      res
        .status(201)
        .json({ message: 'Pet cadastrado com sucesso', newPet: newPet })
    } catch (err) {
      res.status(500).json({ message: err })
    }
  }

  static async getAll(req, res) {
    try {
      const pets = await Pet.find().sort('-createdAt')
      res.status(200).json({ pets: pets })
    } catch (err) {
      res.status(500).json({ message: err })
    }
  }

  static async getAllUserPets(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    try {
      const pets = await Pet.find({ 'user._id': user._id }).sort('-createdAt')
      res.status(200).json({ pets: pets })
    } catch (err) {
      res.status(500).json({ message: err })
    }
  }

  static async getAllUserAdoptions(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    try {
      const pets = await Pet.find({ 'adopter._id': user._id }).sort(
        '-createdAt'
      )
      res.status(200).json({ pets })
    } catch (err) {
      res.status(500).json({ message: err })
    }
  }

  static async getPetById(req, res) {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID Inválido!' })
    }

    // check if pet exists
    const pet = await Pet.findById(id)

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    res.status(200).json({ pet: pet })
  }

  static async removePetById(req, res) {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID Inválido!' })
    }

    const pet = await Pet.findById(id)

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    // check if logged in user registered the pet
    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.toString() !== user._id.toString()) {
      return res.status(422).json({
        message:
          'Houve um problema em processar sua solicitação, tente novamente mais tarde!',
      })
    }

    await Pet.findByIdAndRemove(id)
    res.status(200).json({ message: 'Pet removido com sucesso!' })
  }

  static async updatePet(req, res) {
    const { id } = req.params

    const { name, age, weight, color, available } = req.body

    const images = req.files

    const updatedData = {}

    // check if pet exists
    const pet = await Pet.findById(id)

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    // check if logged user registered the pet
    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.toString() !== user._id.toString()) {
      return res.status(422).json({
        message:
          'Houve um problema em processar sua solicitação, tente novamente mais tarde!',
      })
    }

    if (!name) {
      res.status(422).json({ error: 'O nome é obrigatório' })
      return
    } else {
      updatedData.name = name
    }

    if (!age) {
      res.status(422).json({ error: 'A idade é obrigatória' })
      return
    } else {
      updatedData.age = age
    }

    if (!weight) {
      res.status(422).json({ error: 'O peso é obrigatório' })
      return
    } else {
      updatedData.weight = weight
    }

    if (!color) {
      res.status(422).json({ error: 'A cor é obrigatória' })
      return
    } else {
      updatedData.color = color
    }

    if (images.length > 0) {
      updatedData.images = []
      images.map((image) => {
        updatedData.images.push(image.filename)
      })
    }

    await Pet.findByIdAndUpdate(id, updatedData)

    res.status(200).json({ message: 'Pet atualizado com sucesso!' })
  }

  static async schedule(req, res) {
    const { id } = req.params

    // check if pet exists
    const pet = await Pet.findById(id)

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    // check if logged user registered the pet
    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.equals(user._id)) {
      return res.status(422).json({
        message: 'Você não pode agendar uma visita com seu próprio pet',
      })
    }

    // check if user has already scheduled a visit
    if (pet.adopter) {
      if (pet.adopter._id.equals(user._id)) {
        return res.status(422).json({
          message: 'Você já agendou uma visita para este pet!',
        })
      }
    }

    // add user to pet
    pet.adopter = {
      _id: user._id,
      name: user.name,
      image: user.image,
    }

    await Pet.findByIdAndUpdate(id, pet)

    res.status(200).json({
      message: `A visita foi agendada com sucesso, entre em contato com ${pet.user.name} pelo telefone ${pet.user.phone}`,
    })
  }

  static async concludeAdoption(req, res) {
    const { id } = req.params

    // check if pet exists
    const pet = await Pet.findById(id)

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    // check if logged user registered the pet
    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.equals(user._id)) {
      return res.status(422).json({
        message: 'Você não pode agendar uma visita com seu próprio pet',
      })
    }

    pet.available = false

    await Pet.findByIdAndUpdate(id, pet)

    res.status(200).json({
      message: 'Parabéns! o ciclo de adoção foi realizado com sucesso!',
    })
  }
}
