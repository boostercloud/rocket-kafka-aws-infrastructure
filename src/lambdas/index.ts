/* eslint-disable @typescript-eslint/no-explicit-any */
export const handler = async (event: any): Promise<void> => {
  for (const key in event.records) {
    console.log('Key: ', key)
    // Iterate through records
    event.records[key].map((record: any) => {
      console.log('Record: ', record)
      // Decode base64
      const msg = Buffer.from(record.value, 'base64').toString()
      console.log('Message:', msg)
    })
  }
}

/*
async function saveEvent(key: string): Promise<void> {
  const { v4: uuidv4 } = require('uuid')
  const ddb = new DynamoDB.DocumentClient()
  const s3 = new S3()

  const fileURI = `s3://${stagingBucketName}/${key}`
  const fileSize = (await s3.headObject({ Key: key, Bucket: stagingBucketName }).promise()).ContentLength

  const boosterEvent = {
    fileURI: fileURI,
    filesize: fileSize,
  }

  const params = {
    TableName: process.env.EVENT_STORE_NAME!,
    Item: {
      createdAt: new Date().toISOString(),
      entityID: fileURI,
      entityTypeName: process.env.ENTITY_TYPE_NAME,
      entityTypeName_entityID_kind: `${process.env.ENTITY_TYPE_NAME}-${fileURI}-event`,
      kind: 'event',
      requestID: uuidv4(),
      typeName: process.env.TYPE_NAME,
      value: boosterEvent,
      version: 1,
    },
  }

  try {
    await ddb.put(params).promise()
  } catch (e) {
    console.log('[ROCKET#batch-file] An error occurred while performing a PutItem operation: ', e)
  }
}*/
