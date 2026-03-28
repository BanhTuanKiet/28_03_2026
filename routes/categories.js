var express = require('express');
var router = express.Router();
const slugify = require('slugify');
let categoryModel = require('../schemas/categories')

/* GET users listing. */
router.get('/', async function (req, res, next) {
  let dataCategories = await categoryModel.find(
    {
      isDeleted: false
    }
  )
  res.send(dataCategories);
});
///api/v1/products/id
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findById(id);
    if (!result || result.isDeleted) {
      res.status(404).send({
        message: "ID NOT FOUND"
      });
    } else {
      res.send(result)
    }
  } catch (error) {
    res.status(404).send({
      message: "ID NOT FOUND"
    });
  }
});
router.get('/:id/products', function (req, res, next) {
  let id = req.params.id;
  let result = dataCategories.filter(
    function (e) {
      return e.id == id && !e.isDeleted
    }
  )
  if (result.length) {
    result = dataProducts.filter(
      function (e) {
        return e.category.id == id && !e.isDeleted
      }
    )
    res.send(result)
  } else {
    res.status(404).send({
      message: "ID NOT FOUND"
    });
  }
});
router.post('/', async function (req, res, next) {
  let newCate = new categoryModel({
    name: req.body.name,
    slug: slugify(req.body.name, {
      replacement: '-',
      remove: undefined,
      lower: true
    }),
    image: req.body.image
  })
  await newCate.save();
  res.send(newCate)
})
router.put('/:id', async function (req, res, next) {
  //cach 1
  // try {
  //   let id = req.params.id;
  //   let result = await categoryModel.findById(id);
  //   if (!result || result.isDeleted) {
  //     res.status(404).send({
  //       message: "ID NOT FOUND"
  //     });
  //   } else {
  //     let keys = Object.keys(req.body);
  //     for (const key of keys) {
  //       result[key] = req.body[key];
  //     }
  //     await result.save();
  //     res.send(result)
  //   }
  // } catch (error) {
  //   res.status(404).send({
  //     message: "ID NOT FOUND"
  //   });
  // }
  //cach 2
  try {
    let id = req.params.id;
    let result = await categoryModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send(error)
  }
})
router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findById(id);
    if (!result || result.isDeleted) {
      res.status(404).send({
        message: "ID NOT FOUND"
      });
    } else {
      result.isDeleted = true;
      await result.save();
      res.send(result)
    }
  } catch (error) {
    res.status(404).send({
      message: "ID NOT FOUND"
    });
  }
})
module.exports = router;

