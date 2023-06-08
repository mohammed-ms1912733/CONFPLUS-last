import { getRandomReviewers } from "../../repos/users-repo";

export async function GET(request) {
  return Response.json(await getRandomReviewers()); //Return array of random reviewers
}
