//import { Prisma } from '@prisma/client'

const { PrismaClient } = require("@prisma/client");

const userData = require("./../data/users.json");
const prisma = new PrismaClient();
const scheduleData = require("./../data/schedule.json");
const papersData = require("./../data/papers.json");

const toTimestamp = (strDate) => {
  let [day, month, year] = strDate.split('/');
  const new_date=`${month}/${day}/${year}`
  const dt = new Date(new_date);
  return dt;
};
async function main() {
  //   /////////// users

  for ({ id, email, ...elem } of userData) {
    await prisma.User.upsert({
      where: {
        email: email ?? ""

      },
      update: elem,
      create: { email: email, ...elem },
    });

  }

  // /////////// papers
  const new_papers_data = papersData.map(({ authors, reviews, ...elem }) => ({
    ...elem,
    reviewers: JSON.stringify(elem.reviewers),
  }));

  for (let { id, ...elem } of new_papers_data) {
    await prisma.paper.upsert({
      where: { id: id ?? 0 },
      update: elem,
      create: elem,
    });
  }

  // /////////// schedule

  const new_schedule_data = scheduleData.map(({ presentations, ...elem }) => ({
    ...elem,

    date: toTimestamp(elem.date),
  }));

  for (let { id, ...elem } of new_schedule_data) {
    await prisma.schedule.upsert({
      where: { id: id ?? 0 },
      update: elem,
      create: elem,
    });
  }

  // ///////// presentations

  var new_presentations = []
  for (let { presentations, ...elem } of scheduleData) {
    if (!!presentations?.length) {
      for (let presentation of presentations) {
        new_presentations = [...new_presentations, { ...presentation, scheduleId: elem.id }]
      }
    }

  }

  for (let { paperId, ...elem } of new_presentations) {
    if (!!new_presentations?.length) {
      await prisma.presentation.upsert({
        where: { paperId: paperId },
        update: elem,
        create: { paperId: paperId, ...elem },
      })
    }
  }

  // ////////// authors

  for (let { authors, reviews, ...elem } of papersData) {
    for (let { id, email, ...author } of authors) {
      const user = await prisma.user.upsert({
        where: { email: email ?? "" },
        update: { ...author, role: "author" },
        create: { email: email, ...author, role: "author" },
      })
      await prisma.paperAuthor.upsert({
        where: { uniqueKey: { authorId: user.id, paperId: elem.id } },
        update: {},
        create: { authorId: user.id, paperId: elem.id },
      });
    }
  }

  //  //////// reviews

  for (let { authors, reviews, ...elem } of papersData) {
    if (!!reviews?.length) {
      for (let { reviewerId, overallRating, contribution, ...review } of reviews) {
        await prisma.review.upsert({
          where: { uniqueKey: (reviewerId && elem.id) ? { reviewerId: reviewerId, paperId: elem.id } : 0 },
          update: { ...review, overallRating: overallRating.toString(), contribution: contribution.toString() },
          create: { reviewerId: reviewerId, paperId: elem.id, ...review, overallRating: overallRating.toString(), contribution: contribution.toString() },
        });
      }
    }
  }
  console.dir(userData, { depth: null });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
