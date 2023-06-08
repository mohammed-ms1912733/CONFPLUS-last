import { getPaperById } from "@/app/api/papers/papers-repo"

import { readJSON, writeJSON } from "@/app/lib/utils"
const dataFilePath = "data/schedule.json"
const toTimestamp = (strDate) => {
  let [day, month, year] = strDate.split('/');
  const new_date=`${month}/${day}/${year}`
  const dt = new Date(new_date);
  return dt;
};
function formatDate(date) {
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  
  if (day < 10) day = '0' + day;
  if (month < 10) month = '0' + month;
  
  return `${day}/${month}/${year}`;
}
export async function getSchedule(date) {
  // let schedule = await readJSON(dataFilePath)

  if (date) {
    schedule = schedule.filter((s) => s.date == date)
  }
  let schedules
  if (date) {
    const thisDate = new Date(date)
    schedules = await prisma.schedule.findMany({ where: { date: thisDate }, include: { presentations: { include: { paper: { include: { authors: { include: { author: true } } } } } } } })
  } else {
    schedules = await prisma.schedule.findMany({ include: { presentations: { include: { paper: { include: { authors: { include: { author: true } } } } } } } })
  }

  // // Get the paper for each presentation in the schedule
  // const scheduleWithPaperDetails = []
  // for await (const session of schedule) {
  //   if (!session.presentations) {
  //     scheduleWithPaperDetails.push(session)
  //     continue
  //   }

  //   const presentations = []
  //   for await (const presentation of session.presentations) {
  //     const paper = await getPaperById(presentation.paperId)
  //     //const { title, authors } = await getPaperById(presentation.paperId);
  //     presentation.title = paper.title
  //     const presenter = paper.authors.find((a) => a.isPresenter)
  //     presentation.presenter = `${presenter.firstName}  ${presenter.lastName}`
  //     presentation.authors = paper.authors
  //     presentations.push(presentation)
  //   }
  //   session.presentations = presentations
  //   scheduleWithPaperDetails.push(session)
  // }
  // return scheduleWithPaperDetails*

  return schedules.map(({ presentations, ...schedule }) => ({ ...schedule,date:schedule.date?formatDate(schedule.date):"", presentations: presentations.map(({ paper, ...presentation }) =>
   ({ ...presentation, title: paper.title, authors: paper.authors.map((authorPaper) => (authorPaper.author)),
     presenter: (paper.authors.find((authorPaper) => authorPaper.author.isPresenter).author.firstName +" "+ paper.authors.find((authorPaper) => authorPaper.author.isPresenter).author.lastName )})) }))

}

export async function upsertSchedule(sche) {
  const schedule=sche.map(item=>({...item,id:parseInt(item?.id)}))
  // // Remove paper details (e.g., title, presenter)
  // // from the schedule before saving to avoid data duplication
  // schedule = schedule.map((s) => {
  //   if (!s.presentations) return s
  //   s.presentations = s.presentations.map((p) => {
  //     return {
  //       id: p.id,
  //       paperId: p.paperId,
  //       startTime: p.startTime,
  //       endTime: p.endTime,
  //     }
  //   })
  //   return s
  // })
  const schedulesIds = await prisma.schedule.findMany({ select: { id: true } })
  const schedulesToDelete = schedulesIds.filter((elem) => (!schedule.map((elem) => (elem.id)).includes(elem.id)))?.map((elem) => (elem.id))
 
  const scheduleData = schedule.filter((elem) => (elem.edited))
  const new_schedules = scheduleData.map(({ presentations, authors, presenter, ...elem }) => ({
    ...elem,

    date: toTimestamp(elem.date),
  }));
  for (let { id, ...new_schedule } of new_schedules) {
    delete new_schedule.edited
    delete new_schedule.deletedPres
    await prisma.schedule.upsert({
      where: { id: id ?? 0 },
      update: new_schedule,
      create: new_schedule,
      include: { presentations: { include: { paper: { include: { authors: { include: { author: true } } } } } } }
    })
  }

  var new_presentations = []
  for (let { presentations, ...elem } of scheduleData) {
    if (presentations?.length) {

      for (let presentation of presentations) {
        new_presentations = [...new_presentations, { ...presentation, scheduleId: elem.id }]
      }
    }

  }
  if (new_presentations?.length) {
    for (let { paperId, authors, presenter, id, ...elem } of new_presentations) {

      await prisma.presentation.upsert({
        where: { paperId: paperId },
        update: elem,
        create: { paperId: paperId, ...elem },
      });
    }
  }

  let deletedPresentations = []
  for (let elem of schedule) {
    if (elem?.deletedPres) {
      deletedPresentations = [...deletedPresentations, ...elem?.deletedPres]
    }
  }

  await prisma.presentation.deleteMany({
    where: {
      id: {
        in: deletedPresentations
      }
    }
  })
  await prisma.schedule.deleteMany({
    where: {
      id: {
        in: schedulesToDelete
      }
    }
  })
  // await writeJSON(dataFilePath, schedule)
  return schedule
}
