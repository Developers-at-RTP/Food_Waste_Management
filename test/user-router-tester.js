`use strict`;

const chai = require(`chai`);
const chaiHttp = require(`chai-http`);
const mongoose = require(`mongoose`);
const faker = require(`faker`);

const { app, runServer, closeServer } = require(`../server`);
const { Users } = require(`../userModel`);
const { TEST_DATABASE_URL } = require(`../config`);

chai.use(chaiHttp);
const expect = chai.expect;

// Testing

describe(`User Integration Testing`, function () {
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });
    beforeEach(function () {
        return seedUserData()
            .catch(function (error) {
                throw error;
            });
    });
    afterEach(function () {
        return tearSeedDb();
    });
    after(function () {
        return closeServer();
    });

    describe(`User GET requests`, function () {
        it('should return all existing users', function () {
            let res;
            return chai.request(app)
                .get('/users')
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an(`array`);
                    expect(res.body).to.have.lengthOf.at.least(1);
                    return Users.countDocuments();
                })
                .then(function (count) {
                    expect(res.body).to.have.lengthOf(count);
                })
                .catch(function (err) {
                    throw err;
                });
        });
    });
});

// Helper Functions

function seedUserData() {
    // Create several users for our tests.  Promises used because a unique-string-generater (faker) is a 3rd-party API.
    console.info('Seeding user data.');
    const seedUserData = [];
    const userList = [];

    for (let i = 0; i < 3; i++) {
        const promise = new Promise(function (resolve, reject) {
            return userList.push(generateUser())
                .then(function () {
                    resolve();
                })
                .catch(function (error) {
                    reject(error);
                });
        });
        seedUserData.push(promise);
    }

    return Promise.all(seedUserData)
        .then(function () {
            return Users.insertMany(userList);
        })
        .catch(function (error) {
            return error;
        })
}

function generateUser() {
    const sampleUser = {
        userName: generateFakerName(),
        userPassword: generateString()
    }
    return sampleUser;
}

function generateString() {
    const strings = ["WordsOfInfo", "TextOrName", "StreetOrInfo", "ThingsInAString", "LettersGenerated"];
    return strings[Math.floor(Math.random() * strings.length)];
}

function generateFakerName() {
    // Faker is an API that provides a random string from a large database, essentially guarenteeing a unique userNsame.
    return faker.name.findName();
}

function tearSeedDb() {
    console.warn(`Dropping database.`);
    return mongoose.connection.dropDatabase();
}