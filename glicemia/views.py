from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count
from django.contrib import messages
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
# Imports do ReportLab para a geração do PDF
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from django.http import JsonResponse
import json
from rest_framework.authtoken.models import Token

from .models import PerfilUsuario, PerfilMedico, Medicao, Medicamento, TaxaCorrecao

# --- VIEW: CADASTRO ---
def cadastro_view(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        email = request.POST.get('email')
        cpf = ''.join(filter(str.isdigit, request.POST.get('cpf')))
        data_nasc = request.POST.get('data_nascimento')
        senha = request.POST.get('senha')

        if User.objects.filter(username=email).exists():
            messages.error(request, 'Este e-mail já está cadastrado.')
            return redirect('cadastro')

        # Cria o usuário padrão do Django
        user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
        # Cria o perfil acoplado com CPF e Data de Nascimento
        PerfilUsuario.objects.create(user=user, cpf=cpf, data_nascimento=data_nasc)
        
        messages.success(request, 'Cadastro realizado com sucesso! Faça seu login.')
        return redirect('login')

    return render(request, 'glicemia/cadastro.html')

# --- VIEW: LOGIN DO PACIENTE (Nome exato procurado pelas suas URLs) ---

@csrf_exempt  # 🌟 1. ESSA LINHA É OBRIGATÓRIA AQUI PARA MATAR O ERRO 403!
def login_view(request):
    if request.method == 'POST':
        # 🌟 2. Tratamento para ler o JSON que o React (Axios) envia
        if request.content_type == 'application/json':
            try:
                dados = json.loads(request.body)
                print(f"Tentativa de login para o usuário: {dados.get('username')}")  # 🌟 ISSO VAI MOSTRAR NO SEU TERMINAL O QUE CHEGOU!
                
                # Tenta pegar 'email', se não achar, tenta pegar 'username'
                email = dados.get('email') or dados.get('username')
                senha = dados.get('senha') or dados.get('password')
                
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Dados inválidos'}, status=400)
        else:
            # Mantém compatibilidade com formulário comum
            email = request.POST.get('email')
            senha = request.POST.get('senha')
        
        user = authenticate(request, username=email, password=senha)
        
        if user is not None:
            is_medico = PerfilMedico.objects.filter(user=user).exists()
            
            if is_medico:
                if request.content_type == 'application/json':
                    return JsonResponse({'error': 'Área exclusiva para pacientes.'}, status=403)
                messages.error(request, 'Esta área é exclusiva para pacientes.')
                return redirect('login') 
            
            auth_login(request, user)
            
            # 🌟 3. Para o React: cria/obtém um Token de autenticação e retorna no JSON
            if request.content_type == 'application/json':
                token, _ = Token.objects.get_or_create(user=user)
                return JsonResponse({
                    'success': True,
                    'message': 'Login realizado com sucesso!',
                    'token': token.key,
                    'nome': user.first_name or user.username,
                })
                
            return redirect('dashboard')
        else:
            if request.content_type == 'application/json':
                return JsonResponse({'error': 'E-mail ou senha incorretos.'}, status=400)
            messages.error(request, 'E-mail ou senha incorretos.')
            return redirect('login')
            
    return render(request, 'glicemia/login.html')

# --- VIEW: DASHBOARD & FILTROS (PROTEGIDA) ---
# --- @login_required(login_url='login') ---
@csrf_exempt
def dashboard_view(request):
    # --- AUTENTICAÇÃO VIA TOKEN PARA O REACT ---
    # Se a requisição não veio com sessão autenticada, tenta autenticar via Token
    if not request.user.is_authenticated:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                request.user = token.user
            except Token.DoesNotExist:
                pass
    
    # Garante que o usuário está autenticado antes de filtrar no banco
    if not request.user.is_authenticated:
        return JsonResponse({
            'sucesso': False, 
            'error': 'Sessão encerrada ou usuário não autenticado no servidor.'
        }, status=401)

    # Determina quais dados de usuário devem ser mostrados
    target_user = request.user
    
    # Se for um médico visualizando um paciente, o ID do paciente estará na sessão
    if request.session.get('paciente_id'):
        try:
            target_user = User.objects.get(id=request.session['paciente_id'])
        except User.DoesNotExist:
            request.session.pop('paciente_id', None)
            target_user = request.user
            
    hoje = datetime.now()
    # Pegamos o valor que veio do React ou do HTML (pode ser texto ou número)
    mes_cru = request.POST.get('mes', request.GET.get('mes', hoje.month))
    
    # Criamos um dicionário para converter o nome do mês para o número correto
    meses_map = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    }
    
    # Se o React mandou o nome por extenso (ex: 'Julho'), convertemos usando o mapa.
    if isinstance(mes_cru, str) and mes_cru in meses_map:
        mes_selecionado = meses_map[mes_cru]
    else:
        try:
            mes_selecionado = int(mes_cru)
        except ValueError:
            mes_selecionado = hoje.month
    ano_selecionado = int(request.POST.get('ano', request.GET.get('ano', hoje.year)))

    # Filtra as medições do banco de dados
    medicoes = Medicao.objects.filter(
        usuario=request.user,
        data__month=mes_selecionado,
        data__year=ano_selecionado
    ).order_by('-data', '-hora')
    
    metricas = medicoes.aggregate(total=Count('id'), media=Avg('valor'))
    total_medicoes = metricas['total'] or 0
    media_glicose = round(metricas['media'], 2) if metricas['media'] else 0
    glicada_estimada = round((media_glicose + 46.7) / 28.7, 2) if media_glicose > 0 else 0
    
    is_api_request = (
        'api' in request.path or 
        request.headers.get('Accept') == 'application/json' or
        'application/json' in request.headers.get('Accept', '') or
        'HTTP_AUTHORIZATION' in request.META
    )
    
    if is_api_request:
        medicoes_lista = []
        for m in medicoes:
            medicoes_lista.append({
                'id': m.id,
                'valor': m.valor,
                'data': m.data.strftime('%Y-%m-%d'),
                'hora': m.hora.strftime('%H:%M'),
                'tipo': m.get_tipo_display() if hasattr(m, 'get_tipo_display') else m.tipo,
                'notas': m.notes or '',
            })
        return JsonResponse({
            'medicoes': medicoes_lista,
            'resumo': {
                'total': total_medicoes,
                'media': media_glicose,
                'a1c': glicada_estimada,
            },
            'nome': request.user.first_name or request.user.username,
        })
    
    # Para requisições tradicionais do navegador (templates HTML)
    contexto = {
        'medicoes': medicoes,
        'total_medicoes': total_medicoes,
        'media_glicose': media_glicose,
        'glicada_estimada': glicada_estimada,
        'mes_selecionado': mes_selecionado,
        'ano_selecionado': ano_selecionado,
        'acesso_medico': bool(request.session.get('paciente_id')),
        'paciente_nome': target_user.first_name if request.session.get('paciente_id') else '',
        'paciente_id': target_user.id if request.session.get('paciente_id') else None
    }
    return render(request, 'glicemia/dashboard.html', contexto)

# --- VIEW: NOVA MEDIÇÃO ---
@csrf_exempt
def nova_medicao_view(request):
    # Autenticação via Token para o React
    if not request.user.is_authenticated:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                request.user = token.user
            except Token.DoesNotExist:
                pass

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Não autenticado.'}, status=401)

    if request.method == 'POST':
        # Suporte a JSON (React) e form-data (HTML)
        if request.content_type == 'application/json':
            try:
                dados = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Dados inválidos.'}, status=400)
            valor = dados.get('valor')
            data = dados.get('data')
            hora = dados.get('hora')
            tipo = dados.get('momento') or dados.get('tipo_medicao') or 'Jejum'
            notas = dados.get('observacoes') or dados.get('notas', '')
        else:
            valor = request.POST.get('valor')
            data = request.POST.get('data')
            hora = request.POST.get('hora')
            tipo = request.POST.get('tipo_medicao')
            notas = request.POST.get('notas', '')

        # Cria a medição usando os nomes corretos dos campos do modelo
        Medicao.objects.create(
            usuario=request.user,
            valor=valor,
            data=data,
            hora=hora,
            tipo=tipo,
            notes=notas
        )
        
        # Verifica limites de glicemia
        alerta = None
        try:
            valor_num = float(valor)
            if valor_num < 70:
                alerta = 'Atenção! Sua glicemia está baixa (hipoglicemia). Recomendado subir a glicemia.'
            elif valor_num > 180:
                taxas = TaxaCorrecao.objects.filter(usuario=request.user)
                dose_recommended = None
                for taxa in taxas:
                    if taxa.glicemia_max:
                        if taxa.glicemia_min <= valor_num <= taxa.glicemia_max:
                            dose_recommended = taxa.dose_ui
                            break
                    else:
                        if valor_num >= taxa.glicemia_min:
                            dose_recommended = taxa.dose_ui
                            break
                
                if dose_recommended is not None:
                    alerta = f'Atenção! Sua glicemia está alta (hiperglicemia). Dose de correção recomendada: {dose_recommended} UI.'
                else:
                    alerta = 'Atenção! Sua glicemia está alta (hiperglicemia). Recomendado tomar insulina ou procurar o médico.'
        except (ValueError, TypeError):
            pass
        
        # Se veio do React, retorna JSON
        content_type = request.META.get('CONTENT_TYPE', '') or request.content_type or ''
        if 'application/json' in content_type:
            resposta = {'success': True, 'message': 'Medição registrada com sucesso!'}
            if alerta:
                resposta['alerta'] = alerta
            return JsonResponse(resposta)
        
        messages.success(request, "Nova medição registrada com sucesso!")
        if alerta:
            messages.warning(request, alerta)
            
    return redirect('dashboard')

# --- VIEW: LOGOUT ---
def logout_view(request):
    auth_logout(request)
    return redirect('login')

# =====================================================================
#             PORTAL DO MÉDICO: BUSCA E DIRECIONAMENTO
# =====================================================================

@login_required(login_url='login')
def dashboard_medico_view(request):
    """ Painel inicial do médico para buscar qualquer paciente por CPF """
    if not hasattr(request.user, 'perfil_medico'):
        messages.error(request, 'Acesso restrito a médicos.')
        return redirect('dashboard')
        
    paciente_encontrado = None
    
    if request.method == 'POST':
        cpf_busca = ''.join(filter(str.isdigit, request.POST.get('cpf_busca', '')))
        try:
            perfil_p = PerfilUsuario.objects.get(cpf=cpf_busca)
            paciente_encontrado = perfil_p.user
        except PerfilUsuario.DoesNotExist:
            messages.error(request, 'Paciente com este CPF não foi encontrado.')
            
    return render(request, 'glicemia/dashboard_medico.html', {'paciente_encontrado': paciente_encontrado})


@login_required(login_url='login')
def acessar_paciente_view(request, paciente_id):
    """ Vincula o paciente na sessão do médico para que ele veja as telas dele """
    if not hasattr(request.user, 'perfil_medico'):
        return redirect('dashboard')
        
    paciente = get_object_or_404(User, id=paciente_id)
    request.session['paciente_id'] = paciente.id
    return redirect('dashboard')


@login_required(login_url='login')
def fechar_consulta_view(request):
    """ Desvincula o paciente e devolve o médico ao painel de buscas """
    if 'paciente_id' in request.session:
        del request.session['paciente_id']
    return redirect('dashboard_medico')

# =====================================================================

# --- VIEW: EXPORTAR PDF ---
@csrf_exempt
def exportar_pdf_view(request):
    # Autenticação via Token para o React
    if not request.user.is_authenticated:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                request.user = token.user
            except Token.DoesNotExist:
                pass
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Não autenticado.'}, status=401)

    hoje = datetime.now()
    
    # Converte nome do mês por extenso para número (suporte ao React)
    mes_cru = request.GET.get('mes', str(hoje.month))
    meses_map = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    }
    if mes_cru in meses_map:
        mes = meses_map[mes_cru]
    else:
        try:
            mes = int(mes_cru)
        except ValueError:
            mes = hoje.month
    ano = int(request.GET.get('ano', hoje.year))

    target_user = request.user
    if request.session.get('paciente_id'):
        target_user = get_object_or_404(User, id=request.session['paciente_id'])

    medicoes = Medicao.objects.filter(
        usuario=target_user,
        data__month=mes,
        data__year=ano
    ).order_by('data', 'hora')

    metricas = medicoes.aggregate(media=Avg('valor'))
    media_glicose = round(metricas['media'], 2) if metricas['media'] else 0
    glicada_estimada = round((media_glicose + 46.7) / 28.7, 2) if media_glicose > 0 else 0

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="relatorio_glicemia_{mes}_{ano}.pdf"'

    doc = SimpleDocTemplate(response, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elementos = []
    
    estilos = getSampleStyleSheet()
    titulo_estilo = ParagraphStyle('Titulo', parent=estilos['Heading1'], fontSize=20, leading=24, textColor=colors.HexColor('#1A365D'), spaceAfter=12)
    subtitulo_estilo = ParagraphStyle('Subtitulo', parent=estilos['Normal'], fontSize=11, leading=14, spaceAfter=6)
    
    elementos.append(Paragraph("Relatório de Acompanhamento Glicêmico", titulo_estilo))
    elementos.append(Paragraph(f"<b>Paciente:</b> {target_user.first_name}", subtitulo_estilo))
    elementos.append(Paragraph(f"<b>Período:</b> {mes:02d}/{ano}", subtitulo_estilo))
    elementos.append(Paragraph(f"<b>Média Glicêmica do Mês:</b> {media_glicose} mg/dL | <b>Glicada Estimada (A1C):</b> {glicada_estimada}%", subtitulo_estilo))
    elementos.append(Spacer(1, 15))

    dados_tabela = [['Data', 'Hora', 'Valor (mg/dL)', 'Tipo de Medição', 'Observações']]
    
    for med in medicoes:
        data_formatada = med.data.strftime('%d/%m/%Y')
        hora_formatada = med.hora.strftime('%H:%M')
        dados_tabela.append([
            data_formatada,
            hora_formatada,
            f"{med.valor} mg/dL",
            med.get_tipo_display(),
            med.notes or "-"
        ])

    if len(dados_tabela) == 1:
        dados_tabela.append(['Nenhum registro encontrado para este mês.', '', '', '', ''])

    tabela_pdf = Table(dados_tabela, colWidths=[80, 60, 90, 110, 180])
    tabela_pdf.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A365D')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F7FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))

    elementos.append(tabela_pdf)
    doc.build(elementos)
    return response

# --- VIEW: APAGAR MEDIÇÃO (PROTEGIDA) ---
@login_required(login_url='login')
def apagar_medicao_view(request, id):
    target_user = request.user
    if request.session.get('paciente_id'):
        target_user = get_object_or_404(User, id=request.session['paciente_id'])

    medicao = get_object_or_404(Medicao, id=id, usuario=target_user)
    medicao.delete()
    messages.warning(request, 'Medição excluída com sucesso!')
    return redirect('dashboard')

@login_required(login_url='login')
def editar_medicao_view(request, id):
    target_user = request.user
    if request.session.get('paciente_id'):
        target_user = get_object_or_404(User, id=request.session['paciente_id'])
    medicao = get_object_or_404(Medicao, id=id, usuario=target_user)
    if request.method == 'POST':
        data = request.POST.get('data')
        hora = request.POST.get('hora')
        valor = request.POST.get('valor')
        tipo = request.POST.get('tipo')
        observacao = request.POST.get('observacao')
        if data:
            medicao.data = data
        if hora:
            medicao.hora = hora
        if valor:
            try:
                medicao.valor = float(valor)
            except ValueError:
                messages.error(request, 'Valor inválido.')
                return redirect('editar_medicao', id=id)
        if tipo:
            medicao.tipo = tipo
        medicao.observacao = observacao
        medicao.save()
        messages.success(request, 'Medição atualizada com sucesso!')
        return redirect('dashboard')
    contexto = {
        'medicao': medicao,
        'acesso_medico': bool(request.session.get('paciente_id')),
    }
    return render(request, 'glicemia/editar_medicao.html', contexto)

# --- VIEW: MEDICAÇÕES (LISTAR E ADICIONAR) ---
@login_required(login_url='login')
def medicacoes_view(request):
    target_user = request.user
    medico_logado = None
    
    # Se for um médico editando o prontuário de um paciente
    if request.session.get('paciente_id'):
        target_user = get_object_or_404(User, id=request.session['paciente_id'])
        if hasattr(request.user, 'perfil_medico'):
            medico_logado = request.user.perfil_medico

    if request.method == 'POST':
        tipo_form = request.POST.get('tipo_form')
        
        if tipo_form == 'medicamento':
            nome = request.POST.get('nome')
            dose_ui = request.POST.get('dose_ui')
            observacao = request.POST.get('observacao')

            dose_ui_val = None
            if dose_ui and dose_ui.strip():
                try:
                    dose_ui_val = int(dose_ui)
                except ValueError:
                    pass

            Medicamento.objects.create(
                usuario=target_user,
                nome=nome,
                dose_ui=dose_ui_val,
                observacao=observacao,
                medico_editor=medico_logado # Atribui o médico caso seja ele quem esteja adicionando
            )
            messages.success(request, 'Medicação registrada com sucesso!')
            
        elif tipo_form == 'taxa':
            gmin = request.POST.get('glicemia_min')
            gmax = request.POST.get('glicemia_max')
            dose = request.POST.get('dose_ui')
            
            try:
                gmin_val = int(gmin)
                dose_val = int(dose)
                gmax_val = int(gmax) if gmax and gmax.strip() else None
                
                TaxaCorrecao.objects.create(
                    usuario=target_user,
                    glicemia_min=gmin_val,
                    glicemia_max=gmax_val,
                    dose_ui=dose_val,
                    medico_editor=medico_logado # Atribui o médico caso seja ele quem esteja configurando
                )
                messages.success(request, 'Taxa de correção registrada com sucesso!')
            except ValueError:
                messages.error(request, 'Valores numéricos inválidos para a taxa de correção.')

        return redirect('medicacoes')

    medicamentos = Medicamento.objects.filter(usuario=target_user).order_by('-criado_em')
    taxas = TaxaCorrecao.objects.filter(usuario=target_user).order_by('glicemia_min')
    
    contexto = {
        'medicamentos': medicamentos, 
        'taxas': taxas,
        'acesso_medico': bool(request.session.get('paciente_id')),
        'paciente_nome': target_user.first_name if request.session.get('paciente_id') else ''
    }
    return render(request, 'glicemia/medicacoes.html', contexto)

# --- VIEW: APAGAR MEDICAÇÃO ---
@login_required(login_url='login')
def apagar_medicacao_view(request, id):
    target_user = request.user
    if request.session.get('paciente_id'):
        target_user = get_object_or_404(User, id=request.session['paciente_id'])

    medicamento = get_object_or_404(Medicamento, id=id, usuario=target_user)
    medicamento.delete()
    messages.warning(request, 'Medicação excluída com sucesso!')
    return redirect('medicacoes')

# --- VIEW: APAGAR TAXA DE CORREÇÃO ---
@login_required(login_url='login')
def apagar_taxa_view(request, id):
    target_user = request.user
    if request.session.get('paciente_id'):
        target_user = get_object_or_404(User, id=request.session['paciente_id'])

    taxa = get_object_or_404(TaxaCorrecao, id=id, usuario=target_user)
    taxa.delete()
    messages.warning(request, 'Taxa de correção excluída com sucesso!')
    return redirect('medicacoes')

# --- VIEW: CADASTRO DO PROFISSIONAL (MÉDICO / NUTRICIONISTA) ---
def cadastro_medico_view(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        email = request.POST.get('email')
        cpf = request.POST.get('cpf')
        telefone = request.POST.get('telefone')
        tipo_registro = request.POST.get('tipo_registro') # Pega se é CRM ou CRN
        crm = request.POST.get('crm') # Número do registro
        uf = request.POST.get('uf', 'MG')
        senha = request.POST.get('senha')
        confirmar_senha = request.POST.get('confirmar_senha')

        if User.objects.filter(username=email).exists():
            messages.error(request, 'Este e-mail já está cadastrado.')
            return redirect('cadastro_medico')

        # Como você pediu para não validar nada complexo ainda, vamos apenas criar o usuário
        user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
        
        # Cria o perfil associado. Se o seu modelo PerfilMedico aceitar essas colunas, 
        # você pode salvá-las aqui. Se não, salve apenas o básico por enquanto:
        PerfilMedico.objects.create(user=user, crm=crm, uf=uf)
        
        messages.success(request, 'Cadastro realizado com sucesso! Faça seu login.')
        return redirect('login_medico')

    # ATENÇÃO AQUI: Este return TEM que ficar fora do bloco 'if', alinhado com o 'def'
    return render(request, 'glicemia/cadastro_medico.html')


from django.shortcuts import render
from django.contrib import messages
from django.contrib.auth.models import User
from django.db.models import Avg

from django.db.models import Q
import json

def dashboard_medico_view(request):
    cpf_buscado = request.GET.get('cpf')
    paciente = None
    medicoes = []
    
    hoje = datetime.now()
    mes_selecionado = int(request.GET.get('mes', hoje.month))
    ano_selecionado = int(request.GET.get('ano', hoje.year))

    if cpf_buscado:
        # Tenta achar o paciente de várias formas para evitar o erro de cadastro antigo
        cpf_limpo = ''.join(filter(str.isdigit, cpf_buscado))
        user_paciente = None
        
        if cpf_limpo:
            perfil = PerfilUsuario.objects.filter(cpf__icontains=cpf_limpo).first()
            if perfil:
                user_paciente = perfil.user
                
        if not user_paciente:
            user_paciente = User.objects.filter(
                Q(username__icontains=cpf_buscado) | 
                Q(email__icontains=cpf_buscado) |
                Q(first_name__icontains=cpf_buscado)
            ).first()

        if user_paciente:
            # Filtra medições pelo mês e ano selecionados
            medicoes_qs = Medicao.objects.filter(
                usuario=user_paciente,
                data__month=mes_selecionado,
                data__year=ano_selecionado
            ).order_by('-data', '-hora')
            
            total = medicoes_qs.count()
            media_val = medicoes_qs.aggregate(media=Avg('valor'))['media']
            media_val = round(media_val, 2) if media_val else 0
            glicada_estimada = round((media_val + 46.7) / 28.7, 2) if media_val > 0 else 0

            # Calcula Tempo no Alvo dinâmico
            total_para_alvo = medicoes_qs.count()
            if total_para_alvo > 0:
                hipo_count = medicoes_qs.filter(valor__lt=70).count()
                hiper_count = medicoes_qs.filter(valor__gte=180).count()
                alvo_count = total_para_alvo - hipo_count - hiper_count
                pct_hipo = round((hipo_count / total_para_alvo) * 100)
                pct_hiper = round((hiper_count / total_para_alvo) * 100)
                pct_alvo = 100 - pct_hipo - pct_hiper
            else:
                pct_hipo = 0
                pct_hiper = 0
                pct_alvo = 100

            # Prepara dados do gráfico (medições ordenadas por data/hora para o gráfico)
            medicoes_grafico = medicoes_qs.order_by('data', 'hora')
            labels_grafico = [f"{m.data.strftime('%d/%m')}" for m in medicoes_grafico]
            valores_grafico = [m.valor for m in medicoes_grafico]

            # Descobre o CPF caso exista para exibir
            cpf_exibir = user_paciente.username
            if hasattr(user_paciente, 'perfil') and user_paciente.perfil.cpf:
                cpf_exibir = user_paciente.perfil.cpf

            paciente = {
                'nome': f"{user_paciente.first_name} {user_paciente.last_name}".strip() or user_paciente.username,
                'cpf': cpf_exibir,
                'total_medicoes': total,
                'media_mes': media_val,
                'glicada_estimada': glicada_estimada,
                'user_id': user_paciente.id,
                'pct_hiper': pct_hiper,
                'pct_alvo': pct_alvo,
                'pct_hipo': pct_hipo,
            }
            medicoes = medicoes_qs
        else:
            labels_grafico = []
            valores_grafico = []
            messages.error(request, 'Paciente não localizado. Tente buscar pelo E-mail, Nome ou CPF correto.')
    else:
        labels_grafico = []
        valores_grafico = []

    context = {
        'paciente': paciente,
        'cpf_buscado': cpf_buscado,
        'medicoes': medicoes,
        'mes_selecionado': mes_selecionado,
        'ano_selecionado': ano_selecionado,
        'labels_json': json.dumps(labels_grafico),
        'valores_json': json.dumps(valores_grafico),
    }
    return render(request, 'glicemia/dashboard_medico.html', context)

def login_medico_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        senha = request.POST.get('senha')
        
        from django.contrib.auth import authenticate, login
        from django.contrib import messages
        
        user = authenticate(request, username=email, password=senha)
        
        if user is not None:
            # 🛑 VALIDAÇÃO SEGURANÇA: Garante que ele REALMENTE é médico/nutricionista
            is_medico = PerfilMedico.objects.filter(user=user).exists()
            
            if not is_medico:
                messages.error(request, 'Acesso negado. Este painel é exclusivo para Médicos e Nutricionistas.')
                return redirect('login_medico')
            
            # Se for profissional, entra com sucesso
            login(request, user)
            return redirect('dashboard_medico')
        else:
            messages.error(request, 'E-mail ou senha incorretos.')
            return redirect('login_medico')
            
    return render(request, 'glicemia/login_medico.html')


# --- VIEW: LOGOUT DO MÉDICO ---
def logout_medico_view(request):
    from django.contrib.auth import logout
    from django.shortcuts import redirect
    
    logout(request)
    return redirect('login_medico')

@login_required(login_url='login_medico')
def medicacoes_medico_view(request, cpf):
    cpf_limpo = ''.join(filter(str.isdigit, cpf))
    try:
        perfil = PerfilUsuario.objects.get(cpf=cpf_limpo)
        user_paciente = perfil.user
    except PerfilUsuario.DoesNotExist:
        try:
            user_paciente = User.objects.get(username=cpf_limpo)
        except User.DoesNotExist:
            messages.error(request, 'Paciente não encontrado.')
            return redirect('dashboard_medico')

    medico_logado = getattr(request.user, 'perfil_medico', None)

    if request.method == 'POST':
        tipo_form = request.POST.get('tipo_form')
        if tipo_form == 'medicamento':
            nome = request.POST.get('nome')
            dose_ui = request.POST.get('dose_ui')
            observacao = request.POST.get('observacao')

            dose_ui_val = None
            if dose_ui and dose_ui.strip():
                try:
                    dose_ui_val = int(dose_ui)
                except ValueError:
                    pass

            Medicamento.objects.create(
                usuario=user_paciente,
                nome=nome,
                dose_ui=dose_ui_val,
                observacao=observacao,
                medico_editor=medico_logado
            )
            messages.success(request, 'Medicação registrada para o paciente com sucesso!')
        
        elif tipo_form == 'taxa':
            gmin = request.POST.get('glicemia_min')
            gmax = request.POST.get('glicemia_max')
            dose = request.POST.get('dose_ui')
            
            try:
                gmin_val = int(gmin)
                dose_val = int(dose)
                gmax_val = int(gmax) if gmax and gmax.strip() else None
                
                TaxaCorrecao.objects.create(
                    usuario=user_paciente,
                    glicemia_min=gmin_val,
                    glicemia_max=gmax_val,
                    dose_ui=dose_val,
                    medico_editor=medico_logado
                )
                messages.success(request, 'Taxa de correção registrada com sucesso!')
            except ValueError:
                messages.error(request, 'Valores numéricos inválidos para a taxa de correção.')

        return redirect('medicacoes_medico', cpf=cpf)

    medicamentos = Medicamento.objects.filter(usuario=user_paciente).order_by('-criado_em')
    taxas = TaxaCorrecao.objects.filter(usuario=user_paciente).order_by('glicemia_min')
    
    context = {
        'paciente': {
            'nome': f"{user_paciente.first_name} {user_paciente.last_name}".strip() or user_paciente.username,
            'cpf': cpf,
        },
        'medicamentos': medicamentos,
        'taxas': taxas,
    }
    return render(request, 'glicemia/medicacoes_medico.html', context)


@login_required(login_url='login_medico')
def apagar_medicacao_medico_view(request, id, cpf):
    medicamento = get_object_or_404(Medicamento, id=id)
    medicamento.delete()
    messages.warning(request, 'Medicação excluída com sucesso!')
    return redirect('medicacoes_medico', cpf=cpf)


@login_required(login_url='login_medico')
def apagar_taxa_medico_view(request, id, cpf):
    taxa = get_object_or_404(TaxaCorrecao, id=id)
    taxa.delete()
    messages.warning(request, 'Taxa de correção excluída com sucesso!')
    return redirect('medicacoes_medico', cpf=cpf)

@login_required(login_url='login')
def perfil_view(request):
    """Perfil exclusivo do PACIENTE"""
    user = request.user
    perfil = getattr(user, 'perfil', None)

    if request.method == 'POST':
        if 'foto_perfil' in request.FILES and perfil:
            perfil.foto_perfil = request.FILES['foto_perfil']
            perfil.save()
            messages.success(request, 'Foto de perfil atualizada com sucesso!')
        return redirect('perfil')

    contexto = {
        'user': user,
        'perfil': perfil,
    }
    return render(request, 'glicemia/perfil.html', contexto)


@login_required(login_url='login_medico')
def perfil_medico_view(request):
    """Perfil exclusivo do MÉDICO"""
    user = request.user

    if not hasattr(user, 'perfil_medico'):
        messages.error(request, 'Acesso restrito a médicos.')
        return redirect('login_medico')

    perfil = user.perfil_medico

    if request.method == 'POST':
        if 'foto_perfil' in request.FILES:
            perfil.foto_perfil = request.FILES['foto_perfil']
            perfil.save()
            messages.success(request, 'Foto de perfil atualizada com sucesso!')
        return redirect('perfil_medico')

    contexto = {
        'user': user,
        'perfil': perfil,
    }
    return render(request, 'glicemia/perfil_medico.html', contexto)
