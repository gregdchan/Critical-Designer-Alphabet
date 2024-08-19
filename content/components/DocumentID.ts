import React from 'react'
import { useDocumentOperation } from 'sanity'

const DocumentId = ({ document }) => {
  return (
    <div>
      <h3>Document ID</h3>
      <p>{document?._id}</p>
    </div>
  )
}

export default DocumentId
