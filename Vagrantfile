# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "centos/7"
  config.vm.provision :shell, path: "etc/dev/vm.bootstrap"
  config.vm.hostname = "worldview"
  config.vm.network "forwarded_port", guest: 80, host: 8182

  config.vm.provider "virtualbox" do |vb|
      vb.name = "worldview"
  end
end
