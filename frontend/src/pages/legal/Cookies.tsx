import LegalLayout, { Section, SubSection, UL } from '../../components/LegalLayout'

export default function Cookies() {
  return (
    <LegalLayout title="Política de Cookies" lastUpdated="20 de abril de 2026">

      <Section title="1. ¿Qué son las cookies?">
        <p>
          Las cookies son pequeños archivos de texto que un sitio web almacena en tu dispositivo cuando
          lo visitas. Sirven para recordar tus preferencias, gestionar sesiones de usuario y, en algunos
          casos, rastrear el comportamiento de navegación.
        </p>
        <p>
          Además de las cookies tradicionales (almacenadas en el navegador), las aplicaciones web
          modernas también utilizan <strong className="text-zinc-300">almacenamiento local (localStorage)</strong>{' '}
          del navegador para guardar información de sesión.
        </p>
      </Section>

      <Section title="2. ¿Qué almacenamiento usa AgencyOS?">
        <p>
          AgencyOS tiene un enfoque minimalista respecto al almacenamiento en el dispositivo del
          usuario. A continuación detallamos todo lo que guardamos:
        </p>

        <div className="mt-4 space-y-3">
          {/* Técnicas */}
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-800/60 border-b border-white/5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-bold text-white">Almacenamiento técnico esencial</p>
              <span className="ml-auto text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Necesario</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                {
                  name: 'agencyos_token',
                  type: 'localStorage',
                  purpose: 'Token JWT de autenticación. Permite mantener tu sesión iniciada sin tener que hacer login en cada visita.',
                  duration: 'Hasta que cierras sesión o el token expira (7 días)',
                  thirdParty: false,
                },
                {
                  name: 'agencyos_agency_config',
                  type: 'localStorage',
                  purpose: 'Almacena la configuración de tu agencia (nombre, email, zona horaria) para no tener que introducirla cada vez.',
                  duration: 'Hasta que borras los datos del navegador o los eliminas desde Ajustes → Seguridad',
                  thirdParty: false,
                },
                {
                  name: 'agencyos_onboarded',
                  type: 'localStorage',
                  purpose: 'Registra si ya has completado el proceso de onboarding inicial.',
                  duration: 'Indefinido hasta limpieza del navegador',
                  thirdParty: false,
                },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <code className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">{item.name}</code>
                    <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{item.type}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-1">{item.purpose}</p>
                  <p className="text-[10px] text-zinc-600">Duración: {item.duration}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stripe */}
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-800/60 border-b border-white/5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-sm font-bold text-white">Cookies de terceros (Stripe)</p>
              <span className="ml-auto text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Pagos</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-zinc-400 mb-3">
                Cuando accedes a la sección de facturación o completas un pago, Stripe puede establecer
                cookies propias para garantizar la seguridad de la transacción y prevenir el fraude.
                Estas cookies son gestionadas exclusivamente por Stripe bajo su propia política de
                privacidad.
              </p>
              <p className="text-xs text-zinc-500">
                Consulta la política de cookies de Stripe en:{' '}
                <span className="text-zinc-400">stripe.com/es/privacy</span>
              </p>
            </div>
          </div>

          {/* No analytics */}
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-800/60 border-b border-white/5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <p className="text-sm font-bold text-white">Cookies analíticas y publicitarias</p>
              <span className="ml-auto text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-white/5">No se usan</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-zinc-500">
                AgencyOS <strong className="text-zinc-300">no utiliza</strong> Google Analytics, Meta
                Pixel, cookies de retargeting ni ningún tipo de seguimiento publicitario o analítico
                de terceros. No compartimos datos de navegación con plataformas publicitarias.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="3. Base legal">
        <p>
          El almacenamiento técnico esencial está basado en el{' '}
          <strong className="text-zinc-300">interés legítimo</strong> y en la{' '}
          <strong className="text-zinc-300">necesidad contractual</strong> de prestar el servicio
          (Art. 6.1.b RGPD). Sin este almacenamiento, el servicio no puede funcionar correctamente.
        </p>
        <p>
          Las cookies de Stripe se activan únicamente cuando accedes a funcionalidades de pago y
          son necesarias para la ejecución del contrato de suscripción.
        </p>
      </Section>

      <Section title="4. Cómo gestionar o eliminar el almacenamiento">
        <SubSection title="Eliminar el almacenamiento de AgencyOS">
          <UL items={[
            'Desde la app: ve a Configuración → Seguridad → puedes borrar los datos almacenados localmente.',
            'Desde el navegador: ve a Ajustes → Privacidad → Gestionar datos del sitio → busca agencyos.com y elimina.',
          ]} />
        </SubSection>
        <SubSection title="Gestionar cookies según tu navegador">
          <div className="space-y-2">
            {[
              { name: 'Google Chrome', path: 'Ajustes → Privacidad y seguridad → Cookies y otros datos de sitios' },
              { name: 'Mozilla Firefox', path: 'Ajustes → Privacidad y seguridad → Cookies y datos del sitio' },
              { name: 'Safari', path: 'Preferencias → Privacidad → Gestionar datos del sitio web' },
              { name: 'Microsoft Edge', path: 'Ajustes → Privacidad, búsqueda y servicios → Cookies' },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="font-semibold text-zinc-400 w-32 flex-shrink-0">{b.name}:</span>
                <span className="text-zinc-500">{b.path}</span>
              </div>
            ))}
          </div>
        </SubSection>
        <SubSection title="Consecuencias de deshabilitar el almacenamiento técnico">
          <p>
            Si eliminas o bloqueas el almacenamiento local de AgencyOS, deberás iniciar sesión
            de nuevo en cada visita y perderás tus preferencias de configuración guardadas localmente.
            El resto de funcionalidades no se verá afectado.
          </p>
        </SubSection>
      </Section>

      <Section title="5. Actualizaciones de esta política">
        <p>
          Podemos actualizar esta Política de Cookies si añadimos nuevas funcionalidades que requieran
          almacenamiento adicional. Te informaremos de cambios significativos a través del correo
          electrónico asociado a tu cuenta.
        </p>
      </Section>

      <Section title="6. Contacto">
        <p>
          Para cualquier consulta sobre cookies o almacenamiento en tu dispositivo, escríbenos a{' '}
          <a href="mailto:pregunalborch3@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            pregunalborch3@gmail.com
          </a>.
        </p>
      </Section>

    </LegalLayout>
  )
}
