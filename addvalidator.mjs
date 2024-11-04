import db from "./db/conn.mjs";

export async function addValidatorToGradesCollection() {
  try {
    const collection = db.collection("grades");

    // create indexes in the grades collection for class_id and learner_id
    // if they don't already exist
    //await collection.createIndex({ class_id: 1 }, { unique: true });
    //await collection.createIndex({ learner_id: 1 }, { unique: true });

    // create a combo index of both learner_id and class_id
    // if it doesn't already exist
    //await collection.createIndex({ learner_id: 1, class_id: 1 }, { unique: true });

    db.command({
        collMod: "grades",
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["class_id", "learner_id"],
            properties: {
              class_id: {
                bsonType: "int",
                minimum: 0,
                maximum: 300  
              },
              learner_id: {
                bsonType: "int",
                minimum: 0
              }
            }
          }
        },
        validationAction: "warn"
      });

    console.log("Indexes and validator added successfully.");
  } catch (err) {
    console.error(err.stack);
  }
}

