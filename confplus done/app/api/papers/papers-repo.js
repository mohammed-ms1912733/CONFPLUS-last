import { getRandomReviewers } from "@/app/api/users/users-repo"
import { readJSON, writeJSON } from "@/app/lib/utils"

const dataFilePath = "data/papers.json"
// export const getPapers = async () => await readJSON(dataFilePath)
export async function getPapers(){
const paper=await prisma.paper.findMany({
  include: {
    authors: {include:{author:true}},
    reviews: true
  }

})
// return paper
return paper.map((elem)=>({...elem,authors:elem.authors.map((item)=>(item.author))}))
}
// export async function getPaperById(id) {
//   const papers = await getPapers()
//   return papers.find((p) => p.id == id)
// }

export async function getPaperById(id) {
  const paper = await prisma.paper.findUnique({ where: { id: parseInt(id) }, include: {
    authors: {include:{author:true}},
    reviews: true
  } });
  return{...paper,authors:paper.authors.map((item)=>(item.author))}
}

// export async function addPaper(paper) {
//   try {
//     const papers = await getPapers()
//     console.log("addPaper - paper: ", paper)
//     paper.id = Math.max(...papers.map((paper) => paper.id)) + 1 ?? 1
//     paper.reviewers = await getRandomReviewers() //assign paper to random reviewers
//     papers.push(paper)
//     await writeJSON(dataFilePath, papers)
//     return paper
//   } catch (error) {
//     console.log("addPaper - error: ", error)
//     throw error
//   }
// }
export async function addPaper({authors,...paper}) {


  paper.reviewers = await getRandomReviewers(); //assign paper to random reviewers
  const createdPaper = await prisma.paper.create({ data: paper });
  for (let { id,email, ...author } of authors) {
    const user=await prisma.user.upsert({
      where: { email: email ?? "" },
      update: {...author,role:"author"},
      create: {email:email,...author,role:"author"},
    })
    await prisma.paperAuthor.upsert({
      where: {uniqueKey:{ authorId: user.id, paperId: createdPaper.id } },
      update: {},
      create: { authorId: user.id, paperId: createdPaper.id },
    });
  }
  paper.id=createdPaper.id
  return paper;
}


export async function getAcceptedPapers() {
  let papers = await getPapers()
  papers = papers.filter((p) => {
    const sum = sumOverallEvaluation(p)
    return sum && sum >= 2
  })

  papers = papers.map((p) => {
    //add presenter to each paper
    const presenter = p.authors.find((a) => a.isPresenter)
    console.log("presenter: ", `${presenter.firstName} ${presenter.lastName}`)
    if (presenter) {
      p.presenter = `${presenter.firstName} ${presenter.lastName}`
    }
    return p
  })
  return papers
}

function sumOverallEvaluation(paper) {
  return paper.reviews?.reduce((sum, review) => sum + review.overallRating, 0)
}

// export async function updatePaper(paper) {
//   const papers = await getPapers()
//   const index = papers.findIndex((p) => p.id == paper.id)
//   if (index == -1) throw new Error("Paper not found")
//   papers[index] = paper
//   await writeJSON(dataFilePath, papers)
//   //console.log("updatePaper - paper: ", paper)
//   return paper
// }
export async function updatePaper({id,...paper}) {
  const updatedPaper = await prisma.paper.update({where:{id:parseInt(id)},data:paper, include: {
    authors: {include:{author:true}},
    reviews: true
  }})
  return {...updatedPaper,authors:updatedPaper.authors.map((item)=>(item.author))}
}

// export async function getReviews(paperId) {
//   const paper = await getPaperById(paperId)
//   return paper.reviews
// }
export async function getReviews(paperId) {
  const reviews = await prisma.review.findMany({ where: { paperId: parseInt(paperId) } });
  return reviews;
}


// export async function addReview(paperId, review) {
//   const paper = await getPaperById(paperId)
//   if (!paper.reviews) paper.reviews = []
//   paper.reviews.push(review)
//   await updatePaper(paper)
// }
export async function addReview(paperId, review) {
  const createdReview = await prisma.review.create({ data: { ...review,reviewerId:parseInt(review.reviewerId), paperId: parseInt(paperId) } });
  const paper = await getPaperById(paperId)
  return paper;
}

// export async function updateReview(paperId, review) {
//   const paper = await getPaperById(paperId)
//   const index = paper.reviews?.findIndex(
//     (r) => r.reviewerId == review.reviewerId
//   )
//   if (index == -1) throw new Error("Review not found")
//   paper.reviews[index] = review
//   await updatePaper(paper)
// }
export async function updateReview(paperId, review) {
  const updatedReview = await prisma.review.update({ where: { uniqueKey: { paperId: parseInt(paperId), reviewerId: parseInt(review.reviewerId) } }, data: { ...review,reviewerId:parseInt(review.reviewerId), paperId: parseInt(paperId) } });
  const paper = await getPaperById(paperId)
  return paper;
}