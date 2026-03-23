import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/login" className="mb-6 inline-block text-xs font-medium text-brand-900">
        ← Voltar
      </Link>

      <h1 className="mb-2 text-xl font-bold text-gray-900">Politica de Privacidade</h1>
      <p className="mb-6 text-xs text-gray-400">Ultima atualizacao: 23 de marco de 2026</p>

      <div className="space-y-6 text-[13px] leading-relaxed text-gray-700">
        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">1. Introducao</h2>
          <p>
            A plataforma <strong>Meu Socio</strong> (&quot;nos&quot;, &quot;nosso&quot;) respeita a privacidade dos seus
            usuarios e se compromete a proteger os dados pessoais coletados, em conformidade com a
            Lei Geral de Protecao de Dados (LGPD — Lei n.o 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">2. Dados coletados</h2>
          <p>Coletamos os seguintes dados:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, nome do negocio.</li>
            <li><strong>Dados de uso:</strong> informacoes sobre clientes, agendamentos, servicos e financas inseridas pelo usuario.</li>
            <li><strong>Dados tecnicos:</strong> endereco IP, tipo de navegador, dados de sessao (cookies essenciais).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">3. Finalidade do tratamento</h2>
          <p>Seus dados sao utilizados exclusivamente para:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Fornecer e manter o funcionamento da plataforma;</li>
            <li>Autenticacao e seguranca da conta;</li>
            <li>Envio de notificacoes relacionadas ao servico (agendamentos, vencimentos);</li>
            <li>Melhoria continua da experiencia do usuario;</li>
            <li>Cumprimento de obrigacoes legais.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">4. Base legal (Art. 7o LGPD)</h2>
          <p>O tratamento dos seus dados se baseia em:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Execucao de contrato:</strong> para fornecer o servico contratado;</li>
            <li><strong>Consentimento:</strong> para cookies analiticos e comunicacoes de marketing;</li>
            <li><strong>Interesse legitimo:</strong> para melhorar nossos servicos;</li>
            <li><strong>Obrigacao legal:</strong> para cumprimento de normas fiscais e regulatorias.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">5. Compartilhamento de dados</h2>
          <p>
            <strong>Nao vendemos</strong> seus dados pessoais. Seus dados podem ser compartilhados apenas com:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Supabase:</strong> infraestrutura de banco de dados e autenticacao;</li>
            <li><strong>Vercel:</strong> hospedagem da aplicacao;</li>
            <li><strong>Processadores de pagamento:</strong> quando aplicavel, para gestao de assinaturas;</li>
            <li><strong>Autoridades competentes:</strong> quando exigido por lei.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">6. Cookies</h2>
          <p>Utilizamos:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Cookies essenciais:</strong> necessarios para autenticacao e funcionamento do sistema. Nao podem ser desativados.</li>
            <li><strong>Cookies analiticos:</strong> utilizados para entender como voce usa a plataforma. Podem ser recusados.</li>
          </ul>
          <p className="mt-2">
            Voce pode gerenciar suas preferencias de cookies a qualquer momento nas configuracoes do navegador.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">7. Direitos do titular (Art. 18 LGPD)</h2>
          <p>Voce tem direito a:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Confirmar a existencia de tratamento dos seus dados;</li>
            <li>Acessar seus dados pessoais;</li>
            <li>Corrigir dados incompletos ou desatualizados;</li>
            <li>Solicitar anonimizacao, bloqueio ou eliminacao de dados;</li>
            <li>Solicitar portabilidade dos dados;</li>
            <li>Revogar consentimento a qualquer momento;</li>
            <li>Obter informacoes sobre compartilhamento de dados.</li>
          </ul>
          <p className="mt-2">
            Para exercer seus direitos, entre em contato pelo e-mail: <strong>meusocio.apps@gmail.com</strong>
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">8. Retencao de dados</h2>
          <p>
            Seus dados sao mantidos enquanto sua conta estiver ativa. Apos o cancelamento, os dados
            serao retidos por 30 dias para fins de backup e depois permanentemente excluidos, salvo
            obrigacoes legais que exijam retencao.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">9. Seguranca</h2>
          <p>
            Adotamos medidas tecnicas e administrativas para proteger seus dados, incluindo:
            criptografia em transito (HTTPS/TLS), controle de acesso baseado em funcoes (RLS),
            autenticacao segura e backups regulares.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">10. Encarregado (DPO)</h2>
          <p>
            Para questoes relacionadas a privacidade e protecao de dados, entre em contato com nosso
            encarregado pelo e-mail: <strong>meusocio.apps@gmail.com</strong>
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">11. Alteracoes</h2>
          <p>
            Esta politica pode ser atualizada periodicamente. Notificaremos sobre alteracoes
            significativas por meio da plataforma ou e-mail.
          </p>
        </section>
      </div>
    </div>
  )
}
