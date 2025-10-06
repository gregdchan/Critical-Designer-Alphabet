import React from 'react'
import { useDocumentOperation } from 'sanity'

interface DocumentIdProps {
  document?: {
    _id?: string
  }
}

const DocumentId = ({ document }: DocumentIdProps) => {
  return (
    <div>
      <h3>Document ID</h3>
      <p>{document?._id}</p>
    </div>
  )
}

export default DocumentId
