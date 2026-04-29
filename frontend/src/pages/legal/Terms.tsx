import LegalLayout, { Section, SubSection, UL } from '../../components/LegalLayout'

export default function Terms() {
  return (
    <LegalLayout title="Términos y Condiciones" lastUpdated="20 de abril de 2026">

      <Section title="1. Información general">
        <p>
          Estos Términos y Condiciones (en adelante, «los Términos») regulan el acceso y uso del
          servicio Agenciesos, titularidad de Roberto (en adelante, «Agenciesos», «nosotros» o «el
          prestador»), con domicilio en España y correo de contacto{' '}
          <a href="mailto:pregunalborch3@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            pregunalborch3@gmail.com
          </a>.
        </p>
        <p>
          Al registrarte o utilizar Agenciesos, aceptas estos Términos en su totalidad. Si no estás de
          acuerdo, no debes usar el servicio.
        </p>
      </Section>

      <Section title="2. Descripción del servicio">
        <p>
          Agenciesos es una plataforma SaaS (Software como Servicio) que permite a agencias y
          profesionales del marketing digital:
        </p>
        <UL items={[
          'Generar campañas publicitarias completas mediante inteligencia artificial (copies, hooks, guiones, estructuras de funnel)',
          'Analizar mercados, competidores y estrategias de distribución mediante frameworks de IA',
          'Gestionar y exportar el historial de campañas generadas',
          'Acceder a herramientas de planificación y análisis de contenido',
        ]} />
        <p className="mt-2">
          El servicio utiliza modelos de inteligencia artificial de Anthropic (Claude) para generar
          contenido. Agenciesos actúa como intermediario tecnológico y no garantiza resultados
          comerciales específicos derivados del uso del contenido generado.
        </p>
      </Section>

      <Section title="3. Registro y cuenta de usuario">
        <UL items={[
          'Para acceder al servicio debes crear una cuenta con una dirección de email válida y una contraseña segura.',
          'Eres responsable de mantener la confidencialidad de tus credenciales de acceso.',
          'Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta.',
          'Solo se permite una cuenta por persona o entidad. Las cuentas no son transferibles.',
          'Debes tener al menos 18 años para usar el servicio.',
        ]} />
      </Section>

      <Section title="4. Condiciones de uso aceptable">
        <p>Queda expresamente prohibido:</p>
        <UL items={[
          'Usar Agenciesos para generar contenido ilegal, fraudulento, difamatorio, discriminatorio o que infrinja derechos de terceros.',
          'Intentar acceder de forma no autorizada a sistemas, cuentas o datos de otros usuarios.',
          'Realizar ingeniería inversa, descompilar o intentar extraer el código fuente del servicio.',
          'Usar el servicio para actividades de spam masivo o publicidad engañosa.',
          'Revender, sublicenciar o explotar comercialmente el acceso al servicio sin autorización expresa.',
          'Sobrecargar los sistemas mediante ataques de denegación de servicio o uso automatizado abusivo.',
        ]} />
        <p className="mt-2">
          El incumplimiento de estas condiciones puede resultar en la suspensión inmediata de tu cuenta
          sin derecho a reembolso.
        </p>
      </Section>

      <Section title="5. Precios y suscripción">
        <SubSection title="Plan y precio">
          <p>
            Agenciesos ofrece una suscripción mensual de <strong className="text-zinc-300">49 USD/mes</strong>{' '}
            que incluye acceso completo a todas las funcionalidades de la plataforma.
          </p>
        </SubSection>
        <SubSection title="Campaña de inicio gratuita">
          <p>
            Los nuevos usuarios pueden generar{' '}
            <strong className="text-zinc-300">1 campaña completa de forma gratuita</strong> sin necesidad
            de tarjeta de crédito. Esta campaña gratuita está disponible desde el momento del registro.
            Para acceder a campañas ilimitadas y al resto de funcionalidades Pro, es necesario activar
            una suscripción de pago.
          </p>
        </SubSection>
        <SubSection title="Renovación automática">
          <p>
            La suscripción se renueva automáticamente cada mes. Recibirás un aviso por correo
            electrónico antes de cada renovación. Puedes cancelar en cualquier momento desde la
            sección de Configuración de tu cuenta.
          </p>
        </SubSection>
        <SubSection title="Cambios de precio">
          <p>
            Nos reservamos el derecho de modificar los precios con un preaviso mínimo de{' '}
            <strong className="text-zinc-300">30 días</strong> por correo electrónico. Si no estás
            de acuerdo con el nuevo precio, puedes cancelar tu suscripción antes de que entre en vigor.
          </p>
        </SubSection>
      </Section>

      <Section title="6. Pagos y facturación">
        <p>
          Los pagos se procesan de forma segura a través de{' '}
          <strong className="text-zinc-300">Stripe</strong>, empresa certificada PCI DSS Level 1.
          Agenciesos no almacena datos de tarjetas de crédito o débito en sus servidores.
        </p>
        <UL items={[
          'Los cargos se realizan al inicio de cada período de facturación.',
          'En caso de fallo en el pago, intentaremos el cobro durante 3 días adicionales antes de suspender el servicio.',
          'Las facturas están disponibles desde el portal de cliente de Stripe, accesible desde tu perfil.',
        ]} />
      </Section>

      <Section title="7. Política de cancelación y reembolsos">
        <SubSection title="Cancelación">
          <p>
            Puedes cancelar tu suscripción en cualquier momento desde la sección <em>Configuración → Facturación</em> de tu cuenta o escribiéndonos a{' '}
            <a href="mailto:pregunalborch3@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              pregunalborch3@gmail.com
            </a>.
            La cancelación es efectiva al final del período de facturación en curso, manteniendo el
            acceso hasta esa fecha.
          </p>
        </SubSection>
        <SubSection title="Reembolsos">
          <p>
            Con carácter general, <strong className="text-zinc-300">no realizamos reembolsos prorrateados</strong> por
            el tiempo no utilizado del período en curso. Sin embargo, evaluaremos solicitudes de
            reembolso caso a caso cuando existan circunstancias excepcionales justificadas. Para
            solicitarlo, escríbenos en un plazo máximo de 7 días desde el cargo.
          </p>
        </SubSection>
        <SubSection title="Derecho de desistimiento (consumidores en la UE)">
          <p>
            Si eres consumidor en la Unión Europea, tienes derecho a desistir del contrato en un
            plazo de 14 días naturales desde la contratación, conforme a la Directiva 2011/83/UE.
            No obstante, al aceptar el inicio inmediato del servicio digital,
            reconoces que este derecho puede quedar limitado una vez que hayas comenzado a utilizar
            el servicio activamente.
          </p>
        </SubSection>
      </Section>

      <Section title="8. Contenido generado por IA">
        <p>
          El contenido generado por Agenciesos (copies, análisis, estrategias, calendarios) es producido
          por modelos de inteligencia artificial y tiene carácter orientativo:
        </p>
        <UL items={[
          'Agenciesos no garantiza que el contenido generado sea preciso, completo, actualizado o adecuado para un propósito específico.',
          'El usuario es responsable de revisar, adaptar y verificar el contenido antes de utilizarlo en campañas reales.',
          'Agenciesos no se hace responsable de los resultados publicitarios o comerciales derivados del uso del contenido generado.',
          'El contenido generado no constituye asesoramiento legal, financiero ni médico.',
          'El usuario conserva la propiedad intelectual del contenido generado a partir de sus inputs, sujeto a las condiciones de uso de Anthropic.',
        ]} />
      </Section>

      <Section title="9. Propiedad intelectual">
        <p>
          La plataforma Agenciesos, incluyendo su diseño, código fuente, marcas, logotipos y metodologías,
          son propiedad exclusiva de Agenciesos y están protegidos por las leyes de propiedad intelectual
          aplicables.
        </p>
        <p>
          Te otorgamos una licencia no exclusiva, intransferible y revocable para acceder y usar el
          servicio únicamente para tus propios fines profesionales durante la vigencia de tu suscripción.
        </p>
      </Section>

      <Section title="10. Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la ley aplicable:
        </p>
        <UL items={[
          'Agenciesos no será responsable de daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso del servicio.',
          'La responsabilidad total de Agenciesos frente al usuario no excederá en ningún caso el importe pagado en los 3 meses anteriores al evento que origina la reclamación.',
          'Agenciesos no garantiza que el servicio esté disponible de forma ininterrumpida o libre de errores, aunque nos comprometemos a una disponibilidad objetivo del 99%.',
          'No somos responsables de fallos causados por terceros proveedores (Stripe, Railway, Vercel, Anthropic) ni por causas de fuerza mayor.',
        ]} />
      </Section>

      <Section title="11. Suspensión y cancelación de cuenta">
        <p>
          Nos reservamos el derecho de suspender o cancelar tu cuenta con o sin previo aviso en los
          siguientes casos:
        </p>
        <UL items={[
          'Incumplimiento de estos Términos y Condiciones',
          'Falta de pago reiterada',
          'Uso fraudulento o abusivo del servicio',
          'Solicitud del propio usuario',
        ]} />
        <p>
          En caso de cancelación por incumplimiento, no procederá reembolso alguno por el período
          en curso.
        </p>
      </Section>

      <Section title="12. Modificaciones del servicio">
        <p>
          Agenciesos se reserva el derecho de modificar, suspender o interrumpir cualquier aspecto del
          servicio en cualquier momento. Para cambios significativos, te notificaremos con al menos
          30 días de antelación por correo electrónico.
        </p>
      </Section>

      <Section title="13. Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por el derecho español. Para la resolución de cualquier controversia
          derivada de la interpretación o ejecución de estos Términos, las partes se someten, con
          renuncia expresa a cualquier otro fuero que pudiera corresponderles, a los Juzgados y
          Tribunales españoles competentes.
        </p>
        <p>
          Si eres consumidor, también puedes acudir a la plataforma europea de resolución de litigios
          en línea: <span className="text-zinc-400">ec.europa.eu/consumers/odr</span>.
        </p>
      </Section>

      <Section title="14. Contacto">
        <p>
          Para cualquier consulta sobre estos Términos, puedes contactarnos en:{' '}
          <a href="mailto:pregunalborch3@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            pregunalborch3@gmail.com
          </a>
        </p>
      </Section>

    </LegalLayout>
  )
}
