import { getPaperById,updatePaper } from "../papers-repo"

export async function GET(request, { params }) {
  //get paper by id
  const { paperId } = params
  const paper = await getPaperById(paperId)
  return Response.json(paper)
}

export async function PUT(request, { params }) {
  // Update paper
  // const {paperId} = params;
  const paper = await request.json()
  await updatePaper(paper)
  return Response.json(paper)
}
