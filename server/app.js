import express from 'express';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import firebase, {db} from './firebase'
import * as Sentry from '@sentry/node';

const app = express();


Sentry.init({dsn: 'https://f2c1250fc2344eaa8c11e9a3e2503fb9@o361783.ingest.sentry.io/5239445'});
// app.set('views', path.join(__dirname, 'routes'));
// app.set('view engine', 'pug');
app.use(Sentry.Handlers.requestHandler());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));


const increment = firebase.firestore.FieldValue.increment(1);

app.get('/', (req, res) => {
    res.status(200).send(`OCR API`)
});

// app.post("/orders", (req, res) => {
//     const options = req.body;
//     instance.orders
//         .create(options)
//         .then(order => {
//             console.log(order);
//             res.status(200).send(order)
//         })
//         .catch(err => {
//             console.log(err);
//             res.status(err.status || 500).send(err)
//         });
// });

// app.get('/customers', (req, res) => {
//     const customers = [];
//     const {uid} = req.query;
//     if (uid) {
//         db.collection("customers").where("uid", "==", uid).limit(1).get()
//             .then((customersDocuments) => {
//                 if (customersDocuments.empty) {
//                     console.log(`No valid customer present with the ${uid} uid`);
//                     res.status(400).send(`User Not Present in the database`)
//                 } else {
//                     res.status(200).send(customersDocuments.docs[0].data())
//                 }
//             }).catch((err => {
//             console.log(`Unable to fetch the user ${uid}: ${err.message}`);
//             res.status(err.status || 500).send(err.message)
//         }))
//     } else {
//         db.collection("customers").get()
//             .then((customersResponse => {
//                 customersResponse.forEach(customer => {
//                     customers.push(customer.data())
//                 });
//                 res.status(200).send(customers)
//             })).catch((err => {
//             res.status(err.status || 500).send(err.message)
//         }))
//     }
// });
//


app.post("/users", async (req, res) => {
    try {
        const {name, email, uid} = req.body;
        const userData = {
            name, email, uid
        };

        const statsRef = db.collection("--stats--").doc("customers");
        const batch = db.batch();

        const userRef = await db.collection("users").doc(uid);
        batch.set(userRef, userData,);
        batch.set(statsRef, {count: increment}, {merge: true});
        await batch.commit()

        const user = await userRef.get();
        res.status(200).send(user.data());

    } catch (err) {
        const responseError = {
            error: {
                code: err.code,
                message: err.message,
            }
        }
        res.status(err.code || 500).json(responseError)
    }
})
app.get("/users/:uid", async (req, res) => {
    try {
        const {uid} = req.params;

        const userRef = db.collection("users").doc(uid.toString())
        let user = await userRef.get()
        if (!user.exists) {
            const emptyError = {
                error: {
                    code: 204,
                    message: `No, user available with ${uid}`
                }
            }
            res.status(400).json(emptyError)
        }
        res.status(200).send(user.data());

    } catch (err) {
        const responseError = {
            error: {
                code: err.code,
                message: err.message,
            }
        }
        res.status(err.code || 500).json(responseError)
    }

});

app.post("/ocr", async (req, res) => {
    try {
        const {image, uid} = req.body;

        const statsRef = db.collection("--stats--").doc("ocr");

        const batch = db.batch();
        const ocrRef = await db.collection("users").doc(uid).collection("ocr").add({});
        batch.set(ocrRef, {ocrId: ocrRef, image, text: "This is the text"},);
        batch.set(statsRef, {count: increment}, {merge: true});
        await batch.commit()

        const ocr = await ocrRef.get();
        res.status(200).send(ocr.data());

    } catch (err) {
        const responseError = {
            error: {
                code: err.code,
                message: err.message,
            }
        }
        res.status(err.code || 500).json(responseError)
    }
})
app.get("/ocr/:ocrId", async (req, res) => {
    try {
        const {ocrId} = req.params;
        const {uid} = req.query;

        const ocrRef = db.collection("users").doc(uid).collection("ocr").doc(ocrId)
        let ocr = await ocrRef.get()
        if (!ocr.exists) {
            const emptyError = {
                error: {
                    code: 204,
                    message: `No, ocr available with ${uid}`
                }
            }
            res.status(400).json(emptyError)
        }
        res.status(200).send(ocr.data());

    } catch (err) {
        const responseError = {
            error: {
                code: err.code,
                message: err.message,
            }
        }
        res.status(err.code || 500).json(responseError)
    }

});
app.get("/ocr", async (req, res) => {
    try {
        const {uid} = req.query;
        let ocrArray = [];

        const ocrDocs = await db.collection("users").doc(uid).collection("ocr").get()

        ocrArray = ocrDocs.docs.map(ocrDoc => ocrDoc.data())

        res.status(200).send(ocrArray);

    } catch (err) {
        const responseError = {
            error: {
                code: err.code,
                message: err.message,
            }
        }
        res.status(err.code || 500).json(responseError)
    }

});


// app.post("/invoices", async (req, res) => {
//     const invoiceDetailsBody = req.body;
//     let paymentDetails = invoiceDetailsBody.payment;
//     const databaseDetails = invoiceDetailsBody.data;
//     const statsRef = db.collection("--stats--").doc("invoices");
//     const statsRefResponse = await statsRef.get();
//     const invoiceNumber = {invoice_number: statsRefResponse.data().invoiceNumber};
//     paymentDetails = ({...paymentDetails, ...invoiceNumber});
//
//     const increment = firebase.firestore.FieldValue.increment(1);
//
//     const batch = db.batch();
//
//     instance.invoices.create(paymentDetails)
//         .then(async (invoice) => {
//             const invoiceRef = await db.collection("invoices").doc(invoice.id);
//             const items = [];
//             invoice.line_items.forEach(invoiceItem => {
//                 const item = {
//                     id: invoiceItem.id,
//                     name: invoiceItem.name,
//                     description: invoiceItem.description,
//                     amount: invoiceItem.amount,
//                     quantity: invoiceItem.quantity,
//                     currency: invoiceItem.currency,
//                 };
//                 items.push(item);
//             });
//             const invoiceDetails = {
//                 invoiceId: invoice.id,
//                 custId: invoice.customer_id,
//                 order_id: invoice.order_id,
//                 payment_id: invoice.payment_id,
//                 invoice_number: invoice.invoice_number,
//                 status: invoice.status,
//                 description: invoice.description,
//                 created_at: invoice.created_at,
//                 issued_at: invoice.issued_at,
//                 paid_at: invoice.paid_at,
//                 expire_by: invoice.expire_by,
//                 amount: invoice.amount,
//                 short_url: invoice.short_url,
//                 amount_due: invoice.amount_due,
//                 amount_paid: invoice.amount_paid,
//                 gross_amount: invoice.gross_amount,
//                 tax_amount: invoice.tax_amount,
//                 partial_payment: invoice.partial_payment,
//                 items: items,
//                 customer: {
//                     name: invoice.customer_details.name,
//                     email: invoice.customer_details.email,
//                     number: invoice.customer_details.contact,
//                     address: {
//                         id: invoice.customer_details.billing_address.id,
//                         address1: invoice.customer_details.billing_address.line1,
//                         address2: invoice.customer_details.billing_address.line2,
//                         zip: invoice.customer_details.billing_address.zipcode,
//                         city: invoice.customer_details.billing_address.city,
//                         state: invoice.customer_details.billing_address.state,
//                         country: invoice.customer_details.billing_address.country
//                     }
//                 }
//             };
//
//             db.collection("customers").where("custId", "==", invoice.customer_id).get()
//                 .then((customersResponse) => {
//                     if (customersResponse.docs.length === 0) {
//                         const customer_details = {
//                             custId: invoice.customer_details.id,
//                             name: invoice.customer_details.name,
//                             email: invoice.customer_details.email,
//                             number: invoice.customer_details.contact,
//                         };
//                         const customerRef = db.collection("customers").doc(customer_details.custId)
//                             .set(customer_details)
//                             .then(() => {
//                                 console.log(`Created Customer `, customerRef.id)
//                             }).catch(err => {
//                                 res.status(500).send('Error while creating the customer : ' + err.message)
//                             })
//                     }
//                     console.log(`Customer ${invoice.customer_id} already Present`)
//                 }).catch(err => {
//                 console.log(`Error while finding the Customer: ${err.message}`);
//                 res.status(500).send(`Error creating Customer ${err.message}`)
//             });
//
//             const firebaseInvoiceObject = {
//                 data: {...invoiceDetails},
//                 paymentData: {...invoice},
//                 created_at: invoice.created_at
//             };
//
//             batch.set(invoiceRef, firebaseInvoiceObject);
//             batch.set(statsRef, {count: increment, invoiceNumber: increment}, {merge: true});
//
//             batch.commit()
//                 .then(async () => {
//                     const invoice = await invoiceRef.get();
//                     console.log(invoice.data());
//                     res.status(200).send(invoice.data());
//                 }).catch(err => {
//                 console.log(`Unable to update the firebase ${err.message}`);
//                 res.status(err.status || 500).send(`Unable to update the firebase ${err.message}`);
//             });
//
//         }).catch(err => {
//         console.error(err);
//         res.status(err.status || 500).send(`Unable to create an invoice : ${err.message}`)
//     })
//
// });
//
// app.get("/invoices", (req, res) => {
//     let invoices = [];
//     const {custId} = req.query;
//     if (custId) {
//         db.collection("invoices")
//             .where("data.custId", "==", custId)
//             .orderBy("created_at", "asc")
//             .get()
//             .then(invoicesResponse => {
//                 if (invoicesResponse.empty) {
//                     res.status(200).send([])
//                 } else {
//                     for (const invoice of invoicesResponse.docs) {
//                         invoices.push(invoice.data())
//                     }
//                     res.status(200).send(invoices);
//                 }
//             }).catch(err => {
//             console.log(err.message);
//             res.status(err.status || 500).send(`Unable to get the invoices for the customer ${custId}: ${err.message}`);
//         });
//     } else {
//         db.collection("invoices")
//             .orderBy("created_at", "asc")
//             .get()
//             .then(invoicesResponse => {
//                 if (invoicesResponse.empty) {
//                     res.status(500).send("No Invoices Available")
//                 } else {
//                     for (const invoice of invoicesResponse.docs) {
//                         invoices.push(invoice.data())
//                     }
//                     res.status(200).send(invoices);
//                 }
//             })
//             .catch(err => {
//                 console.log(`Error: Unable to fetch the Invoices => ${err.message}`);
//                 res.status(err.status || 500).send(err.message);
//             });
//
//     }
// });
//
// app.get("/invoices/:invoiceId", (req, res) => {
//     const {invoiceId} = req.params;
//     if (!invoiceId) {
//         res.status(400).send("Error: Please provide the invoice id with the request")
//     }
//     db.collection("invoices").doc(invoiceId).get()
//         .then((response => {
//             console.log(response.data());
//             res.status(200).send(response.data());
//         })).catch(err => {
//         console.error(`Unable to fetch the invoice : ${invoiceId} => ${err.message}`);
//         res.status(err.status || 500).send(`Server error:  ${err.message}`);
//     })
// });
//
// app.put("/invoices/:invoiceId", (req, res) => {
//     const {invoiceId} = req.params;
//     if (!invoiceId) {
//         res.status(400).send(`Please provide the correct invoiceId to fetch the invoice`)
//     }
//     const updatedInvoiceData = req.body;
//     db.collection("invoices").doc(invoiceId).update(updatedInvoiceData).then(() => {
//         db.collection("invoices").doc(invoiceId).get()
//             .then(response => {
//                 console.log("Updated the Invoice: ", invoiceId);
//                 res.status(200).send(response.data());
//             }).catch(err => {
//             res.status(err.status || 500).send(`Unable to get update the data: ${err.message}`);
//         })
//     }).catch((err) => {
//         console.log(`Unable to update the invoice : ${invoiceId}, ${err.message}`);
//         res.status(err.status || 500).send(`Unable to update the data: , ${err.message}`);
//     });
// });


app.get('/debug-sentry', function mainHandler(req, res) {
    throw new Error('This is an test error!');
});

app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "\n" + err.message);
});

const listener = app.listen(process.env.PORT || 8080 || 8500, function () {
    console.log("Listening on port " + listener.address().port);
});

export default app;
