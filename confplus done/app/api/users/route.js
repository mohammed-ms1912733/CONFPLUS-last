import { getAccountById,getAccountByEmail,getAccountsOfRole,getAccounts } from "../repos/users-repo";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userID = searchParams.get("userID");
  const email = searchParams.get("email");
  const role = searchParams.get("role");
  if (userID) {
    const account = await getAccountById(userID);
    return Response.json(account);
  } else if (email) {
    const account = await getAccountByEmail(email);
    if (!account) {
      return new Response(null, { status: 404 });
    }
    return Response.json(account);
  } else if (role) {
    const accounts = await getAccountsOfRole(role);
    return Response.json(accounts);
  }
  const accounts = await getAccounts();
  return Response.json(accounts);
}
