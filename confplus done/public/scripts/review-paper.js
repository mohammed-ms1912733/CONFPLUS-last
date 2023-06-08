const paperOptions = document.querySelector("#paperOptions")
let isNewReview = false //Flag to check if review is new or existing

let papers = []
let user
document.addEventListener("DOMContentLoaded", async () => {
  //Current user
  user = JSON.parse(localStorage.user)
  if (!user) {
    //For testing purposes
    user = await getUserByEmail("lukeharris@reviewer.com")
  }

  await loadPaperOptions()
  await onPaperSelected()
})

async function onPaperSelected() {
  const paperId = paperOptions.value
  if (!paperId) {
    document.querySelector("#paperInfo").style.display = "none"
    document.querySelector("#reviewForm").style.display = "none"
    return
  }
  const paper = getPaper(paperId)
  const review = paper.reviews?.find((review) => review.reviewerId == user.id)
  console.log("onPaperSelected - review:", paper.reviews, user.id)
  console.log(paper.authors)
  document.querySelector("#paperTitle").innerText = paper.title
  document.querySelector("#paperAbstract").innerText = paper.abstract
  document.querySelector("#paperURL").href = paper.paperURL
  document.querySelector("#authorsList").innerHTML = authorsToHTML(
    paper.authors
  )

  const form = document.forms[0]
  form.reset()

  if (review) {
    form.querySelector("#strength").value = review.strength
    form.querySelector("#weakness").value = review.weakness

    form.querySelector(
      `input[name="overallRating"][value="${review.overallRating}"]`
    ).checked = true
    form.querySelector(
      `input[name="contribution"][value="${review.contribution}"]`
    ).checked = true
  } else {
    isNewReview = true
  }
}

async function onSubmit() {
  window.event.preventDefault()
  const form = document.forms[0]
  const paperId = paperOptions.value
  const overallRating = form.querySelector(
    'input[name="overallRating"]:checked'
  ).value
  const contribution = form.querySelector(
    'input[name="contribution"]:checked'
  ).value
  const strength = form.querySelector("#strength").value.trim()
  const weakness = form.querySelector("#weakness").value.trim()
  const review = {
    reviewerId: user.id,
    overallRating,
    contribution,
    strength,
    weakness,
  }
  console.log("onSubmit - review:", paperId, review)
  await submitReview(paperId, review, isNewReview)
  alert("Review saved successfully")
}

async function getPaperByReviewerId(id) {
  const response = await fetch(`/api/papers?reviewerID=${id}`)
  return await response.json()
}

function getPaper(id) {
  return papers.find((p) => p.id == id)
  //const response = await fetch(`/api/papers/${id}`)
  //return await response.json()
}

async function getUserByEmail(email) {
  const response = await fetch(`/api/users?email=${email}`)
  if (response.status === 404) return undefined
  const user = await response.json()
  return user
}

async function submitReview(paperId, review, isNewReview = false) {
  // Save review on the client side
  const paper = getPaper(paperId)
  if (isNewReview) {
    paper.reviews.push(review)
  } else {
    const index = paper.reviews?.findIndex((r) => review.reviewerId == user.id)
    paper.reviews[index] = review
  }

  // Save review on the server side
  const response = await fetch(`/api/papers/${paperId}/reviews`, {
    method: isNewReview ? "POST" : "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  })
  return response.json()
}

function authorsToHTML(authors) {
  return authors
    ?.map(
      (a) => `<table class="card">
        <tr>
            <th>Name: </th>
            <td>${a.firstName} ${a.lastName}</td>
        </tr>
        <tr>
            <th>Email: </th>
            <td>${a.email}</td>
        </tr>
        <tr>
            <th>Affiliation:</th>
            <td>${a.affiliation}</td>
        </tr>
    </table>`
    )
    .join("")
}

async function loadPaperOptions() {
  papers = await getPaperByReviewerId(user.id)
  //console.log("loadPaperOptions - papers:", papers)
  const paperOptions = document.querySelector("#paperOptions")

  if (!papers || papers.length == 0) {
    const option = document.createElement("option")
    option.value = ""
    option.text = "No Papers to Review"
    paperOptions.appendChild(option)
    return
  }
  papers.forEach((paper) => {
    const option = document.createElement("option")
    option.value = paper.id
    option.text = paper.title
    paperOptions.appendChild(option)
  })
}
