"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.number(),
  date: z.string(),
  status: z.enum(["pending", "paid"]),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  try {
    const rawFormData = {
      customerId: formData.get("customerId"),
      amount: Number(formData.get("amount")),
      status: formData.get("status"),
    };
    const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
    //   console.log(rawFormData);
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
  } catch (err) {
    console.log(err);
    return { error: err };
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  const rawFormData = {
    customerId: formData.get("customerId"),
    amount: Number(formData.get("amount")),
    status: formData.get("status"),
  };
  const { customerId, amount, status } = CreateInvoice.parse(rawFormData);

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/invoices");
}
