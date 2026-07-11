import { RegistrationForm } from "@/presentation/components/registration/registration-form";

export const metadata = {
  title: "Eylül Dönemi Ön Kayıt | D2P Academy",
  description:
    "D2P Academy Eylül dönemi atölye programları için ön kayıt formu. 3D Tasarım, 3D Baskı ve Robotik atölyelerine hemen başvurun.",
};

export default function PreRegistrationPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            D2P Academy
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Eylül Dönemi Ön Kayıt
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            3D Tasarım, 3D Baskı ve Robotik atölyelerimiz için ön kayıt formunu doldurun. Ekibimiz
            en kısa sürede sizinle iletişime geçecektir.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}
