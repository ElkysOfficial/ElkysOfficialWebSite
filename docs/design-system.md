# Design System elkys - Guia de Componentes

## Visão Geral

Este guia documenta os padrões de design system para botões e formulários no projeto elkys. Seguimos os padrões do **shadcn/ui** com customizações específicas para nossa identidade visual.

---

## 🎨 Filosofia

- **Consistência**: Mesmo estilo visual em todo o projeto
- **Composabilidade**: Componentes pequenos e reutilizáveis
- **Acessibilidade**: Seguindo padrões WCAG e usando Radix UI
- **Type Safety**: TypeScript em todos os componentes
- **Manutenibilidade**: Mudanças centralizadas nos componentes base

---

## 🔘 Botões

### Importação

```typescript
import { Button } from "@/components/ui/button";
```

### Variantes Disponíveis

#### Variantes Padrão

1. **default** - Botão primário com cor da marca

   ```tsx
   <Button variant="default">Clique aqui</Button>
   ```

2. **destructive** - Ações destrutivas (deletar, cancelar)

   ```tsx
   <Button variant="destructive">Excluir</Button>
   ```

3. **outline** - Botões secundários com borda

   ```tsx
   <Button variant="outline">Cancelar</Button>
   ```

4. **secondary** - Botões terciários

   ```tsx
   <Button variant="secondary">Ver mais</Button>
   ```

5. **ghost** - Botões minimalistas sem fundo

   ```tsx
   <Button variant="ghost">Fechar</Button>
   ```

6. **link** - Estilo de link

   ```tsx
   <Button variant="link">Saiba mais</Button>
   ```

7. **accent** - Cor de destaque laranja

   ```tsx
   <Button variant="accent">Ação importante</Button>
   ```

8. **gradient** - Gradiente roxo (CTA principal)

   ```tsx
   <Button variant="gradient">Começar agora</Button>
   ```

9. **gradient_secondary** - Gradiente sutil
   ```tsx
   <Button variant="gradient_secondary">Ver detalhes</Button>
   ```

#### Variantes Animadas (Novo) ✨

10. **animated** - Botão com animação shimmer + breathe

    ```tsx
    <Button variant="animated">Fale com especialista</Button>
    ```

11. **animated-secondary** - Botão branco animado
    ```tsx
    <Button variant="animated-secondary">Ver cases</Button>
    ```

### Tamanhos

```tsx
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>
```

### Propriedade `animated` (Opcional)

Adiciona animação shimmer a qualquer variant:

```tsx
<Button variant="gradient" animated>
  Com animação
</Button>
```

### Exemplos Práticos

#### Hero CTA

```tsx
<Button
  variant="animated"
  size="lg"
  className="w-full sm:w-auto"
  onClick={() => window.open("https://wa.me/5531997382935", "_blank")}
>
  Fale com um especialista
  <ArrowRight className="ml-2 h-4 w-4 btn-arrow-animate" />
</Button>
```

#### Formulário Submit

```tsx
<Button type="submit" variant="gradient" size="lg" disabled={isSubmitting} className="w-full">
  {isSubmitting ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      Enviando...
    </>
  ) : (
    <>
      Enviar mensagem
      <Send className="ml-2 h-4 w-4" />
    </>
  )}
</Button>
```

#### Botão de Navegação

```tsx
<Link to="/cases">
  <Button variant="animated-secondary" size="lg">
    Ver nossos cases
  </Button>
</Link>
```

---

## 🔐 Social Login Buttons

### Importação

```typescript
import { SocialButton } from "@/components/auth/SocialButton";
```

### Uso

```tsx
<SocialButton
  provider="google"
  onClick={handleGoogleLogin}
  disabled={isSubmitting}
  icon={<GoogleIcon />}
>
  Continuar com Google
</SocialButton>

<SocialButton
  provider="github"
  disabled={true}
  icon={<GitHubIcon />}
>
  Continuar com GitHub (Em breve)
</SocialButton>
```

### Props

- `provider`: `"google" | "github"`
- `icon`: React Node (ícone do provedor)
- `disabled`: boolean
- Todas as props do componente Button

---

## 📝 Formulários

### Componentes Disponíveis

#### Label

Importação:

```typescript
import { Label } from "@/components/ui/label";
```

Uso básico:

```tsx
<Label htmlFor="email">Email</Label>
```

Com asterisco de obrigatório:

```tsx
<Label htmlFor="name" required>
  Nome completo
</Label>
```

Variantes de tamanho e peso:

```tsx
<Label size="sm" weight="semibold">Label pequena</Label>
<Label size="default" weight="default">Label padrão</Label>
```

#### FormItem

Container que adiciona espaçamento consistente:

```typescript
import { FormItem } from "@/components/ui/form-field";
```

```tsx
<FormItem>
  <Label>...</Label>
  <Input>...</Input>
  <FormMessage>...</FormMessage>
</FormItem>
```

#### FormMessage

Exibe mensagens de erro (auto-oculta quando vazio):

```typescript
import { FormMessage } from "@/components/ui/form-field";
```

```tsx
<FormMessage>{errors.email?.message}</FormMessage>
```

### Padrões de Formulário

#### Campo de Texto Simples

```tsx
<FormItem>
  <Label htmlFor="name" required>
    Nome completo
  </Label>
  <Input id="name" type="text" placeholder="Seu nome" {...register("name")} />
  <FormMessage>{errors.name?.message}</FormMessage>
</FormItem>
```

#### Campo de Email

```tsx
<FormItem>
  <Label htmlFor="email" required>
    E-mail
  </Label>
  <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
  <FormMessage>{errors.email?.message}</FormMessage>
</FormItem>
```

#### Campo de Senha com Toggle

```tsx
<FormItem>
  <Label htmlFor="password" size="sm" weight="semibold">
    Senha
  </Label>
  <div className="relative">
    <Input
      id="password"
      type={showPassword ? "text" : "password"}
      placeholder="••••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="h-11 text-sm pr-10 border-2 focus:border-primary"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
</FormItem>
```

#### Campo de Textarea

```tsx
<FormItem>
  <Label htmlFor="message" required>
    Mensagem
  </Label>
  <Textarea id="message" placeholder="Digite sua mensagem..." rows={5} {...register("message")} />
  <FormMessage>{errors.message?.message}</FormMessage>
</FormItem>
```

#### Grid de Campos (2 colunas)

```tsx
<div className="grid sm:grid-cols-2 gap-4">
  <FormItem>
    <Label htmlFor="name" required>
      Nome
    </Label>
    <Input id="name" {...register("name")} />
    <FormMessage>{errors.name?.message}</FormMessage>
  </FormItem>

  <FormItem>
    <Label htmlFor="email" required>
      Email
    </Label>
    <Input id="email" type="email" {...register("email")} />
    <FormMessage>{errors.email?.message}</FormMessage>
  </FormItem>
</div>
```

---

## 🎭 Classes de Animação Utilitárias

Disponíveis em `src/index.css`:

### Animações de Botão

- `.btn-primary-animate` - Efeito shimmer no hover
- `.btn-secondary-animate` - Efeito shimmer secundário
- `.btn-breathe` - Pulsação sutil na sombra
- `.btn-arrow-animate` - Deslize de ícone seta

### Uso

```tsx
{/* ❌ Evite usar diretamente */}
<Button className="btn-primary-animate btn-breathe">

{/* ✅ Use a variant animated */}
<Button variant="animated">

{/* ✅ Para casos especiais, use animated prop */}
<Button variant="gradient" animated>
```

---

## 📋 Checklist de Migração

Ao criar novos componentes ou atualizar existentes:

### Botões

- [ ] Use `<Button>` ao invés de `<button>` nativo
- [ ] Escolha a variant apropriada ao invés de className customizado
- [ ] Use `variant="animated"` para botões CTAs principais
- [ ] Adicione prop `animated` se precisar de shimmer em outra variant
- [ ] Para social login, use `<SocialButton>`

### Formulários

- [ ] Substitua `<label>` por `<Label>`
- [ ] Envolva campos em `<FormItem>`
- [ ] Use `<FormMessage>` para erros
- [ ] Configure variants de Label: `size="sm" weight="semibold"` para auth pages
- [ ] Mantenha `space-y-3` ou `space-y-4` entre campos

---

## 🎯 Casos de Uso por Contexto

### Landing Page / Marketing

- **CTA Principal**: `variant="animated"`
- **CTA Secundário**: `variant="animated-secondary"` ou `variant="outline"`
- **Links**: `variant="link"`

### Formulários

- **Submit**: `variant="gradient"` ou `variant="default"`
- **Cancelar**: `variant="outline"` ou `variant="ghost"`
- **Ação Destrutiva**: `variant="destructive"`

### Dashboards

- **Ações Primárias**: `variant="default"` ou `variant="accent"`
- **Ações Secundárias**: `variant="outline"`
- **Ações Terciárias**: `variant="ghost"`

### Autenticação

- **Login/Cadastro**: `variant="gradient"`
- **Social Login**: `<SocialButton>`
- **Voltar/Cancelar**: `variant="outline"`

---

## 🚀 Boas Práticas

### ✅ Faça

1. **Use componentes do design system**

   ```tsx
   <Button variant="gradient">Enviar</Button>
   ```

2. **Combine variants com className apenas para layout**

   ```tsx
   <Button variant="animated" className="w-full sm:w-auto">
   ```

3. **Use Label com prop required**

   ```tsx
   <Label htmlFor="email" required>
     Email
   </Label>
   ```

4. **Componha com FormItem para consistência**
   ```tsx
   <FormItem>
     <Label>...</Label>
     <Input>...</Input>
     <FormMessage>...</FormMessage>
   </FormItem>
   ```

### ❌ Evite

1. **Não use button nativo**

   ```tsx
   {/* ❌ */}
   <button className="bg-primary text-white...">

   {/* ✅ */}
   <Button variant="default">
   ```

2. **Não faça override de cores/estilos**

   ```tsx
   {/* ❌ */}
   <Button variant="accent" className="bg-red-500 text-white">

   {/* ✅ */}
   <Button variant="destructive">
   ```

3. **Não use label HTML nativo**

   ```tsx
   {
     /* ❌ */
   }
   <label className="text-sm font-medium">Nome *</label>;

   {
     /* ✅ */
   }
   <Label required>Nome</Label>;
   ```

4. **Não repita estruturas de erro**

   ```tsx
   {
     /* ❌ */
   }
   {
     error && <p className="text-red-600 text-xs mt-1">{error}</p>;
   }

   {
     /* ✅ */
   }
   <FormMessage>{error}</FormMessage>;
   ```

---

## 🔄 Versionamento

**Versão Atual**: 1.0.0

### Changelog

#### v1.0.0 (2024)

- ✅ Criação componentes base (Label, FormItem, FormMessage)
- ✅ Novas variants de Button (animated, animated-secondary)
- ✅ Componente SocialButton
- ✅ Migração de todos os componentes principais
- ✅ Documentação completa

---

## 📚 Referências

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [CVA (Class Variance Authority)](https://cva.style/)

---

## 🤝 Contribuindo

Ao adicionar novos componentes:

1. Siga os padrões do shadcn/ui
2. Use TypeScript com tipos completos
3. Implemente variants com CVA
4. Adicione documentação neste arquivo
5. Teste em dark mode
6. Valide acessibilidade

---

## 📞 Suporte

Dúvidas sobre o design system? Entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: Dezembro 2025
**Mantido por**: Equipe elkys
