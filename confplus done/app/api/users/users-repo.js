import { readJSON } from "@/app/lib/utils"
import prisma from "@/app/lib/prisma"

const dataPath = "data/users.json"


export async function getAccounts() {
  const users = await prisma.user.findMany()
  return users
}

export const login = async (email, password) => {
  // const users = await getUsers()
  // const user = users.find((u) => u.email == email && u.password == password)
  const user = await prisma.user.findFirst({ where: { email: email, password: password } })
  console.log("user",user)
  console.dir({ where: { email: email, password: password } }, { depth: null });

  if (!user) throw new Error("Login Failed. Invalid email or password")
  delete user.password
  return user
}

export async function getAccountById(id) {
  const account = await prisma.user.findUnique({ where: { id: id } });
  return account;
}


export async function getAccountByEmail(email) {
  const account = await prisma.user.findFirst({ where: { email: email } });
  return account;
}


export async function getAccountsOfRole(role) {
  const accounts = await prisma.user.findMany({ where: { role: role } });
  return accounts;
}



export async function getRandomReviewers() {
  // const users = await getUsers()
  // const reviewers = users.filter((u) => u.role == "reviewer")
  const reviewers = await prisma.user.findMany({ where: { role: "reviewer" } })
  let randomIndices = new Set()
  while (randomIndices.size !== 2) {
    randomIndices.add(Math.floor(Math.random() * reviewers.length))
  }
  // convert Set to Array
  randomIndices  = [...randomIndices]
  const reviewer1 = reviewers[randomIndices[0]].id
  const reviewer2 = reviewers[randomIndices[1]].id
  return JSON.stringify([reviewer1, reviewer2])
}
