import { useState, useEffect } from 'react'
import { Button, Modal } from 'react-bootstrap'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Select from 'react-select'
import { format, setISODay } from 'date-fns'
import { BsPlus, BsTrash, BsPencil } from "react-icons/bs";
import { useForm } from "react-hook-form"

// Firebase
import { useCollectionData } from 'react-firebase-hooks/firestore';
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

if (firebase.apps.length === 0) {
  firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
authDomain: process.env.REACT_APP_AUTH_DOMAIN,
projectId: process.env.REACT_APP_PROJECT_ID,
storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
appId: process.env.REACT_APP_APP_ID,
measurementId: process.env.REACT_APP_MEASUREMENT_ID
  })
}
const firestore = firebase.firestore()
const auth = firebase.auth()


// const data = require('./sampleData.json')

const categories = [
  { id: -1, name: 'Uncategorized' },
  { id: 0, name: '-- All --' },
  { id: 1, name: 'Food' },
  { id: 2, name: 'Fun' },
  { id: 3, name: 'Transportation' },
  { id: 4, name: 'Books' },
  { id: 5, name: 'Home' },
]

export default function Journal() {
  const [category, setCategory] = useState()
  const { register, handleSubmit } = useForm()
  const [showForm, setShowForm] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [tempData, setTempData] = useState({
    id: null,
    createdAt: new Date(),
    description: '',
    amount: null,
    category: null
  })

  // Firebase stuff
  const money2Ref = firestore.collection('money2');
  const query = money2Ref.orderBy('id', 'asc').limitToLast(100);
  const [data] = useCollectionData(query, { idField: 'id' });


  console.log("REACT_APP_PROJECT_ID", process.env.REACT_APP_PROJECT_ID)

  // This will be run when 'data' is changed.
  useEffect(() => {
    if (data) { // Guard condition
      let r = data.map((d, i) => {
        // console.log('useEffect', format(d.createdAt.toDate(), "yyyy-MM-dd"))
        return (
          <JournalRow
            data={d}
            i={i}
            onDeleteClick={handleDeleteClick}
            onEditClick={handleEditClick}
          />
        )
      })

      setRecords(r)

    }
  },
    [data])


  const handleCategoryFilterChange = (obj) => {
    console.log('filter', obj)
    if (data) { // Guard condition      
      let filteredData = data.filter(d => obj.id == 0 || d.category.id == obj.id)
      let r = filteredData.map((d, i) => {
        console.log('filter', d)
        
        return (
          <JournalRow data={d} i={i} />
        )
      })
      
    
    }
  }


  // Handlers for Modal Add Form
  const handleshowForm = () => setShowForm(true)

  // Handlers for Modal Add Form
  const handleCloseForm = () => {
    setTempData({
      id: null,
      category: ''
    })
    setCategory({})
    setShowForm(false)
    setEditMode(false)
  }

  // Handle Add Form submit
  const onSubmit = async (data) => {
    let preparedData = {
      // ...data,
      id: parseFloat(data.id),
      category: data.category
    }
    console.log('onSubmit', preparedData)




    if (editMode) {
      // Update record
      console.log("UPDATING!!!!", data.id)
      await money2Ref.doc(data.id)
        .set(preparedData)
        .then(() => console.log("money2Ref has been set"))
        .catch((error) => {
          console.error("Error: ", error);
          alert(error)
        });
    } else {
      // Add to firebase
      // This is asynchronous operation, 
      // JS will continue process later, so we can set "callback" function
      // so the callback functions will be called when firebase finishes.
      // Usually, the function is called "then / error / catch".
      await money2Ref
        .add(preparedData)
        .then(() => console.log("New category has been added."))
        .catch((error) => {
          console.error("Error:", error)
          alert(error)
        })
      // setShowForm(false)
    }
    handleCloseForm()
  }

  const handleCategoryChange = (obj) => {
    console.log('handleCategoryChange', obj)
    setCategory(obj)
  }


  const handleDeleteClick = (id) => {
    console.log('handleDeleteClick in Journal', id)
    if (window.confirm("Are you sure to delete this category?"))
      money2Ref.doc(id).delete()
  }

  const handleEditClick = (data) => {
    let preparedData = {
      id: parseFloat(data.id),
      category: data.category
    }
    console.log("handleEditClick", preparedData)
    // expect original data type for data.createdAt is Firebase's timestamp
    // convert to JS Date object and put it to the same field
    // if ('toDate' in data.createdAt) // guard, check wther toDate() is available in createdAt object.
    //   data.createdAt = data.createdAt.toDate()

    setTempData(preparedData)
    setCategory(data.category)
    setShowForm(true)
    setEditMode(true)
  }


  return (
    <Container>
      <Row>
        <Col>
          <h1>Category Management</h1>
          <Button variant="outline-dark" onClick={handleshowForm}>
            <BsPlus /> Add
      </Button>
        </Col>
        

      </Row>
    

      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            
            <th>Id</th>
            <th>Categories</th>
            <th>Delete</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {records}
        </tbody>
      </Table>


      <Modal
        show={showForm} onHide={handleCloseForm}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="hidden"
            placeholder="ID"
            ref={register({ required: false})}
            name="id"
            id="id"
            defaultValue={tempData.id}
          />
          <Modal.Header closeButton>
            <Modal.Title>
              {editMode ? "Update Category" : "Add New Category"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col>
                <label htmlFor="category">Category</label>
              </Col>
              <Col>
                <input
                type="category"
                placeholder="Category"
                
                ref={register({ required: true })}
                options={categories.filter(c => c.id != 0)}
                onChange={handleCategoryChange}
                name="category"
                id="category"
                getOptionLabel={x => x.name}
                getOptionValue={x => x.id}
                />
              </Col>
            </Row>

            
            
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseForm}>
              Close
          </Button>
            <Button variant={editMode ? "primary" : "primary"} type="submit">
              {editMode ? "Save Record" : "Add Record"}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </Container>
  )
}

function JournalRow(props) {
  let d = props.data
  let i = props.i
  // console.log("JournalRow", d)
  return (
    <tr>
        <td></td>
      
      <td>{d.category}</td>
      <td><BsTrash onClick={() => props.onDeleteClick(d.id)} /></td>
      <td><BsPencil onClick={() => props.onEditClick(d)} /></td>

    </tr>
  )
}